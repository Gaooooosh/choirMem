'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../providers/Auth'
import { TrackCard } from './TrackCard'

interface Track {
  id: string
  title: string
  description: any // 可能是字符串或Lexical富文本数组
}

interface TrackWithStats extends Track {
  versionCount: number
  totalLikes: number
}

export const HomeClient: React.FC = () => {
  const { user } = useAuth()
  const [tracks, setTracks] = useState<TrackWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 检查环境变量
    const payloadUrl = process.env.NEXT_PUBLIC_PAYLOAD_URL || 'http://localhost:3010'
    
    const fetchTracks = async () => {
      try {
        // 获取曲目数据
        const tracksResponse = await fetch(`${payloadUrl}/api/tracks?limit=100`)
        
        if (!tracksResponse.ok) {
          throw new Error(`获取曲目失败: ${tracksResponse.status}`)
        }
        
        const tracksData = await tracksResponse.json()
        
        // 获取每个曲目的版本数据以计算统计信息
        const tracksWithStats = await Promise.all(
          tracksData.docs.map(async (track: Track) => {
            try {
              // 获取该曲目的所有版本
              const versionsResponse = await fetch(
                `${payloadUrl}/api/track-versions?where[track][equals]=${track.id}&limit=100`
              )
              
              if (!versionsResponse.ok) {
                console.error(`获取曲目 ${track.id} 的版本失败: ${versionsResponse.status}`)
                return {
                  ...track,
                  versionCount: 0,
                  totalLikes: 0
                }
              }
              
              const versionsData = await versionsResponse.json()
              
              // 计算版本数量
              const versionCount = versionsData.totalDocs || 0
              
              // 计算总点赞数
              let totalLikes = 0
              if (versionsData.docs) {
                totalLikes = versionsData.docs.reduce(
                  (sum: number, version: any) => sum + (version.likes?.length || 0),
                  0
                )
              }
              
              return {
                ...track,
                versionCount,
                totalLikes
              }
            } catch (versionError) {
              console.error(`处理曲目 ${track.id} 的版本时出错:`, versionError)
              return {
                ...track,
                versionCount: 0,
                totalLikes: 0
              }
            }
          })
        )
        
        setTracks(tracksWithStats)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching tracks:', error)
        setError('获取曲目数据失败')
        setLoading(false)
      }
    }

    fetchTracks()
  }, [])

  if (loading) {
    return <div className="container mx-auto py-8">加载中...</div>
  }

  if (error) {
    return <div className="container mx-auto py-8 text-red-500">错误: {error}</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">
        Hi，{user?.name || user?.username || '用户'}欢迎回到爱乐
      </h1>
      
      {tracks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">暂无曲目数据</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      )}
    </div>
  )
}