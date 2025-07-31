'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../providers/Auth'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/utilities/ui'

// Import the Card component from our components directory
import { Card as TrackCard } from '@/components/Card'
import { getClientSideURL } from '@/utilities/getURL'

interface Track {
  id: string
  title: string
  description: any // 可能是字符串或Lexical富文本数组
  slug: string
}

interface TrackWithStats extends Track {
  versionCount: number
  totalLikes: number
}

interface SystemSettings {
  welcome_message?: string
}

const payloadUrl = getClientSideURL()

export const HomeClient: React.FC = () => {
  const [tracks, setTracks] = useState<TrackWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [welcomeMessage, setWelcomeMessage] = useState<string>("欢迎 {username} 回到爱乐")
  const { user } = useAuth()

  useEffect(() => {
    // 获取系统设置
    const fetchSystemSettings = async () => {
      try {
        const response = await fetch(`${payloadUrl}/api/globals/system-settings`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: SystemSettings = await response.json()
        if (data.welcome_message) {
          setWelcomeMessage(data.welcome_message)
        }
      } catch (err) {
        console.error('获取系统设置时出错:', err)
        // 使用默认值
      }
    }

    const fetchTracks = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${payloadUrl}/api/tracks?limit=100`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        // 获取每个曲目的统计数据
        const tracksWithStats = await Promise.all(
          data.docs.map(async (track: Track) => {
            // 获取版本数量
            const versionsResponse = await fetch(`${payloadUrl}/api/track-versions?where[track][equals]=${track.id}&limit=0`, {
              credentials: 'include',
            })
            const versionsData = await versionsResponse.json()
            
            // 计算总点赞数
            let totalLikes = 0
            if (versionsData.docs && versionsData.docs.length > 0) {
              totalLikes = versionsData.docs.reduce((sum: number, version: any) => sum + (version.likes || 0), 0)
            }
            
            return {
              ...track,
              versionCount: versionsData.totalDocs || 0,
              totalLikes
            }
          })
        )

        setTracks(tracksWithStats)
      } catch (err) {
        console.error('获取曲目数据时出错:', err)
        setError('无法加载曲目数据')
      } finally {
        setLoading(false)
      }
    }

    fetchSystemSettings()
    fetchTracks()
  }, [])

  // 处理欢迎标语
  const renderWelcomeMessage = () => {
    if (user) {
      const username = user?.name || user?.username || '用户'
      return welcomeMessage.replace('{username}', username)
    } else {
      // 对于未登录用户，移除 {username} 占位符
      return welcomeMessage.replace('{username}', '').replace(/\s+/g, ' ').trim()
    }
  }

  // 简化描述文本，只显示纯文本
  const getDescriptionText = (description: any) => {
    if (!description) return ''
    
    // 如果description是数组格式（Lexical富文本）
    if (Array.isArray(description)) {
      // 简单处理，提取文本内容
      const text = description.map((node: any) => {
        if (node.type === 'text') {
          return node.text
        } else if (node.children) {
          return node.children.map((child: any) => child.text || '').join('')
        }
        return ''
      }).join(' ')
      
      return text.substring(0, 100) + (text.length > 100 ? '...' : '')
    }
    
    // 如果是字符串格式
    if (typeof description === 'string') {
      return description.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
    }
    
    return ''
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">出错了</h2>
          <p className="text-red-500 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>
            重新加载
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        {renderWelcomeMessage()}
      </h1>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="flex flex-col animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-3 border-t">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">暂无曲目</h2>
            <p className="text-gray-600 mb-6">目前还没有任何曲目，请稍后再来查看。</p>
            <Button onClick={() => window.location.reload()}>
              刷新页面
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tracks.map((track) => (
            <TrackCard 
              key={track.id}
              doc={{
                slug: track.slug,
                title: track.title,
                meta: {
                  description: getDescriptionText(track.description),
                  image: `/media/track-placeholder.svg`
                }
              } as any}
              relationTo="tracks"
              className="h-full"
            />
          ))}
        </div>
      )}
    </div>
  )
}