'use client'

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '../../../providers/Auth'
import { useTheme } from '@/providers/Theme'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Music, Users, Heart, Loader2 } from 'lucide-react'
import { getClientSideURL } from '@/utilities/getURL'

interface Track {
  id: string
  title: string
  description: any
  slug: string
  createdAt: string
}

interface TrackWithStats extends Track {
  versionCount: number
  totalLikes: number
}

interface HomeClientProps {
  initialTracks: Track[]
  hasMore: boolean
}

interface SystemSettings {
  welcome_message?: string
}

const payloadUrl = getClientSideURL()

export const HomeClient: React.FC<HomeClientProps> = ({
  initialTracks,
  hasMore: initialHasMore,
}) => {
  const [tracks, setTracks] = useState<TrackWithStats[]>([])
  const [filteredTracks, setFilteredTracks] = useState<TrackWithStats[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [welcomeMessage, setWelcomeMessage] = useState<string>('欢迎来到合唱团记忆')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const { user } = useAuth()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const currentTheme = mounted ? theme : 'light'

  const observerRef = useRef<HTMLDivElement>(null)

  // 批量获取曲目统计数据 - 性能优化
  const fetchBatchTrackStats = async (tracks: Track[]): Promise<TrackWithStats[]> => {
    try {
      const trackIds = tracks.map(track => track.id).filter(id => id != null && id !== '')
      
      // 批量获取所有版本数据，包含likes字段
      const versionsResponse = await fetch(
        `${payloadUrl}/api/track-versions?where[track][in]=${trackIds.join(',')}&limit=1000&depth=1`,
        { credentials: 'include' },
      )
      const versionsData = await versionsResponse.json()


      // 按曲目ID分组统计
      const statsMap = new Map<string, { versionCount: number; totalLikes: number }>()
      
      // 初始化所有曲目的统计数据
      trackIds.forEach(id => {
        statsMap.set(id, { versionCount: 0, totalLikes: 0 })
      })

      // 统计版本数量和点赞数
      if (versionsData.docs) {
        versionsData.docs.forEach((version: any) => {
          const trackId = typeof version.track === 'object' ? version.track.id : version.track
          const likesCount = version.likes?.length || 0
          // 确保trackId是字符串类型以匹配statsMap的键
          const trackIdStr = String(trackId)
          const stats = statsMap.get(trackIdStr)
          if (stats) {
            stats.versionCount++
            stats.totalLikes += likesCount
          }
        })
      }

      return tracks.map(track => ({
        ...track,
        versionCount: statsMap.get(track.id)?.versionCount || 0,
        totalLikes: statsMap.get(track.id)?.totalLikes || 0,
      }))
    } catch (error) {
      console.error('批量获取曲目统计数据失败:', error)
      return tracks.map(track => ({
        ...track,
        versionCount: 0,
        totalLikes: 0,
      }))
    }
  }

  // 加载更多曲目 - 性能优化
  const loadMoreTracks = useCallback(async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const response = await fetch(`${payloadUrl}/api/tracks?limit=20&page=${page + 1}`, {
        credentials: 'include',
      })
      const data = await response.json()

      if (data.docs.length > 0) {
        const newTracksWithStats = await fetchBatchTrackStats(data.docs)
        setTracks((prev) => [...prev, ...newTracksWithStats])
        setPage((prev) => prev + 1)
        setHasMore(data.hasNextPage)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('加载更多曲目失败:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, page])

  // 无限滚动观察器
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreTracks()
        }
      },
      { threshold: 0.1 },
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [loadMoreTracks, hasMore, loadingMore])

  // 初始化数据 - 性能优化
  useEffect(() => {
    const initializeTracks = async () => {
      setLoading(true)
      const tracksWithStats = await fetchBatchTrackStats(initialTracks)
      setTracks(tracksWithStats)
      setFilteredTracks(tracksWithStats)
      setLoading(false)
    }

    initializeTracks()
  }, [initialTracks])

  // 搜索过滤 - 防抖优化
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchTerm])
  
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setFilteredTracks(tracks)
    } else {
      const filtered = tracks.filter((track) =>
        track.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
      )
      setFilteredTracks(filtered)
    }
  }, [debouncedSearchTerm, tracks])

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

    fetchSystemSettings()
  }, [])

  // 处理欢迎标语 - 使用useMemo优化
  const welcomeText = useMemo(() => {
    if (user) {
      const username = user?.name || user?.username || '用户'
      return welcomeMessage.replace('{username}', username)
    } else {
      // 对于未登录用户，移除 {username} 占位符
      return welcomeMessage.replace('{username}', '').replace(/\s+/g, ' ').trim()
    }
  }, [user, welcomeMessage])

  // 优化的TrackCard组件
  const TrackCard = React.memo(({ track, index, currentTheme, getDescriptionText }: {
    track: TrackWithStats
    index: number
    currentTheme: string
    getDescriptionText: (description: any) => string
  }) => (
    <Link href={`/tracks/${track.slug || track.id}`}>
      <motion.div
        key={track.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, delay: index * 0.02 }}
        whileHover={{
          y: -8,
          transition: { duration: 0.2 },
        }}
        className="break-inside-avoid mb-6 cursor-pointer"
      >
        <div
          className={`relative group backdrop-blur-3xl rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-3xl ${
            currentTheme === 'dark'
              ? 'bg-gradient-to-br from-white/15 via-white/8 to-white/5 border-white/20'
              : 'bg-gradient-to-br from-white/25 via-white/15 to-white/10 border-white/30'
          }`}
          style={{
            boxShadow: currentTheme === 'dark'
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
          }}
        >
          {/* 简化装饰层 - 性能优化 */}
          <div
            className={`absolute inset-0 rounded-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-300 ${
              currentTheme === 'dark'
                ? 'bg-gradient-to-br from-blue-500/5 to-purple-600/5'
                : 'bg-gradient-to-br from-blue-400/8 to-purple-500/8'
            }`}
          />
          <Card className="bg-transparent border-0 relative z-10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 line-clamp-2 ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {track.title}
                  </h3>
                  <p className={`text-sm line-clamp-3 mb-4 ${
                    currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {getDescriptionText(track.description)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className={`flex items-center space-x-1 ${
                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Music className="w-4 h-4" />
                  <span>{track.versionCount || 0} 个版本</span>
                </div>
                <div className={`flex items-center space-x-1 ${
                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Heart className="w-4 h-4" />
                  <span>{track.totalLikes || 0} 点赞</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </Link>
  ))

  // 提取描述文本 - 使用useCallback优化
  const getDescriptionText = useCallback((description: any) => {
    if (!description) return '暂无描述'

    if (typeof description === 'string') {
      return description.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
    }

    if (description.root && description.root.children) {
      const text = description.root.children
        .map((node: any) => {
          if (node.type === 'text') return node.text
          if (node.children) {
            return node.children.map((child: any) => child.text || '').join('')
          }
          return ''
        })
        .join(' ')
      return text.substring(0, 100) + (text.length > 100 ? '...' : '')
    }

    return '暂无描述'
  }, [])

  TrackCard.displayName = 'TrackCard'

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12 backdrop-blur-xl bg-gradient-to-br from-white/60 to-white/30 border border-white/20 rounded-2xl shadow-xl max-w-md mx-auto"
          >
            <h2 className="text-2xl font-bold mb-4">出错了</h2>
            <p className="text-red-500 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>重新加载</Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 动态背景 - 绝对定位，确保滚动时不被暂停 */}
      <div className="absolute inset-0 -z-10" style={{ willChange: 'transform' }}>
        <div
          className={`absolute inset-0 transition-all duration-800 ${
            currentTheme === 'dark'
              ? 'bg-gradient-to-br from-slate-800 via-blue-900/20 to-purple-900/20'
              : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
          }`}
          style={{ willChange: 'opacity, transform' }}
        />

        {/* 动态渐变带 - 增强显眼度 */}
        <motion.div
          className="absolute inset-0 opacity-50"
          style={{
            background: currentTheme === 'dark'
              ? 'linear-gradient(45deg, rgba(59, 130, 246, 0.25) 0%, rgba(147, 51, 234, 0.22) 25%, rgba(236, 72, 153, 0.2) 50%, rgba(34, 197, 94, 0.18) 75%, rgba(251, 146, 60, 0.2) 100%)'
              : 'linear-gradient(45deg, rgba(59, 130, 246, 0.18) 0%, rgba(147, 51, 234, 0.16) 25%, rgba(236, 72, 153, 0.14) 50%, rgba(34, 197, 94, 0.12) 75%, rgba(251, 146, 60, 0.15) 100%)',
            willChange: 'background',
          }}
          animate={{
            background: currentTheme === 'dark'
              ? [
                  'linear-gradient(45deg, rgba(59, 130, 246, 0.25) 0%, rgba(147, 51, 234, 0.22) 25%, rgba(236, 72, 153, 0.2) 50%, rgba(34, 197, 94, 0.18) 75%, rgba(251, 146, 60, 0.2) 100%)',
                  'linear-gradient(225deg, rgba(251, 146, 60, 0.25) 0%, rgba(59, 130, 246, 0.22) 25%, rgba(147, 51, 234, 0.2) 50%, rgba(236, 72, 153, 0.18) 75%, rgba(34, 197, 94, 0.2) 100%)',
                  'linear-gradient(45deg, rgba(59, 130, 246, 0.25) 0%, rgba(147, 51, 234, 0.22) 25%, rgba(236, 72, 153, 0.2) 50%, rgba(34, 197, 94, 0.18) 75%, rgba(251, 146, 60, 0.2) 100%)'
                ]
              : [
                  'linear-gradient(45deg, rgba(59, 130, 246, 0.18) 0%, rgba(147, 51, 234, 0.16) 25%, rgba(236, 72, 153, 0.14) 50%, rgba(34, 197, 94, 0.12) 75%, rgba(251, 146, 60, 0.15) 100%)',
                  'linear-gradient(225deg, rgba(251, 146, 60, 0.18) 0%, rgba(59, 130, 246, 0.16) 25%, rgba(147, 51, 234, 0.14) 50%, rgba(236, 72, 153, 0.12) 75%, rgba(34, 197, 94, 0.15) 100%)',
                  'linear-gradient(45deg, rgba(59, 130, 246, 0.18) 0%, rgba(147, 51, 234, 0.16) 25%, rgba(236, 72, 153, 0.14) 50%, rgba(34, 197, 94, 0.12) 75%, rgba(251, 146, 60, 0.15) 100%)'
                ]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* 波浪动画层 - 增强显眼度 */}
        {mounted && (
          <motion.div
            className="absolute inset-0 overflow-hidden opacity-40"
            style={{
              background: currentTheme === 'dark'
                ? 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.18) 0%, transparent 50%)'
                : 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.12) 0%, transparent 50%)',
              willChange: 'background',
            }}
            animate={{
              background: currentTheme === 'dark'
                ? [
                    'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.18) 0%, transparent 50%)',
                    'radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.2) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.18) 0%, transparent 50%)',
                    'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.18) 0%, transparent 50%)'
                  ]
                : [
                    'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.12) 0%, transparent 50%)',
                    'radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.12) 0%, transparent 50%)',
                    'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.12) 0%, transparent 50%)'
                  ]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}

        {/* 简化背景系统 - 性能优化 */}
        {mounted && (
          <>
            {/* 增强多色弥散光晕层 - 增强显眼度 */}
            {Array.from({ length: 5 }).map((_, i) => {
              const colors = currentTheme === 'dark' 
                ? [
                    'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(147, 51, 234, 0.25) 50%, transparent 100%)', // 蓝紫
                    'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(168, 85, 247, 0.22) 50%, transparent 100%)', // 粉紫
                    'radial-gradient(circle, rgba(34, 197, 94, 0.28) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 100%)', // 绿蓝
                    'radial-gradient(circle, rgba(251, 146, 60, 0.32) 0%, rgba(236, 72, 153, 0.24) 50%, transparent 100%)', // 橙粉
                    'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(34, 197, 94, 0.22) 50%, transparent 100%)'  // 紫绿
                  ]
                : [
                    'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(147, 51, 234, 0.18) 50%, transparent 100%)', // 蓝紫
                    'radial-gradient(circle, rgba(236, 72, 153, 0.22) 0%, rgba(168, 85, 247, 0.16) 50%, transparent 100%)', // 粉紫
                    'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, rgba(59, 130, 246, 0.14) 50%, transparent 100%)', // 绿蓝
                    'radial-gradient(circle, rgba(251, 146, 60, 0.24) 0%, rgba(236, 72, 153, 0.18) 50%, transparent 100%)', // 橙粉
                    'radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(34, 197, 94, 0.16) 50%, transparent 100%)'  // 紫绿
                  ];
              
              const positions = [
                { left: '15%', top: '20%', size: 400 },
                { left: '75%', top: '15%', size: 350 },
                { left: '10%', top: '70%', size: 300 },
                { left: '80%', top: '65%', size: 380 },
                { left: '45%', top: '45%', size: 320 }
              ];
              
              return (
                <motion.div
                  key={`diffuse-orb-${i}`}
                  className="absolute blur-[120px] opacity-80"
                  style={{
                    width: `${positions[i].size}px`,
                    height: `${positions[i].size}px`,
                    left: positions[i].left,
                    top: positions[i].top,
                    background: colors[i],
                    willChange: 'transform',
                  }}
                  animate={{
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 2.5,
                  }}
                />
              );
             })}

            {/* 多色流动层 - 增强显眼度 */}
            <motion.div
              className="absolute inset-0 blur-[25px] opacity-50"
              style={{
                background: currentTheme === 'dark'
                  ? `linear-gradient(120deg, 
                      rgba(59, 130, 246, 0.3) 0%, 
                      rgba(236, 72, 153, 0.25) 20%,
                      rgba(34, 197, 94, 0.22) 40%,
                      rgba(251, 146, 60, 0.28) 60%,
                      rgba(168, 85, 247, 0.25) 80%,
                      rgba(59, 130, 246, 0.2) 100%)`
                  : `linear-gradient(120deg, 
                      rgba(59, 130, 246, 0.22) 0%, 
                      rgba(236, 72, 153, 0.18) 20%,
                      rgba(34, 197, 94, 0.16) 40%,
                      rgba(251, 146, 60, 0.2) 60%,
                      rgba(168, 85, 247, 0.18) 80%,
                      rgba(59, 130, 246, 0.14) 100%)`,
                willChange: 'transform',
              }}
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 60,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* 静态边缘渐变 */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  currentTheme === 'dark'
                    ? `radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.2) 100%)`
                    : `radial-gradient(ellipse at center, transparent 40%, rgba(255, 255, 255, 0.2) 100%)`,
                willChange: 'opacity, transform',
              }}
            />
          </>
        )}
      </div>

      {/* 可滚动内容区域 */}
      <div className="relative z-10 min-h-screen overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 页面标题和搜索 */}
        <div className="text-center space-y-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <h1
              className={`text-5xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-4 ${
                currentTheme === 'dark'
                  ? 'from-blue-400 via-purple-400 to-pink-400'
                  : 'from-blue-600 via-purple-600 to-pink-600'
              }`}
            >
              {welcomeText}
            </h1>
            <p
              className={`text-xl max-w-2xl mx-auto ${
                currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              在这里记录我们的北邮爱乐合唱团
            </p>
          </motion.div>

          {/* 搜索框 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-lg mx-auto relative"
          >
            <Search
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'
              }`}
            />
            <div className="relative">
              <div
                className={`absolute inset-0 rounded-2xl ${
                  currentTheme === 'dark'
                    ? 'bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5'
                    : 'bg-gradient-to-br from-blue-400/10 via-transparent to-purple-400/10'
                }`}
              />
              <Input
                type="text"
                placeholder="搜索曲目..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-12 py-4 text-lg backdrop-blur-xl rounded-2xl transition-all duration-300 relative z-10 ${
                  currentTheme === 'dark'
                    ? 'bg-white/15 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/25 focus:border-white/30'
                    : 'bg-white/80 border-white/40 text-gray-900 placeholder:text-gray-500 focus:bg-white/90 focus:border-white/50'
                }`}
                style={{
                  boxShadow:
                    currentTheme === 'dark'
                      ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      : '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* 曲目瀑布流 */}
        {loading ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 max-w-5xl mx-auto">
            {Array.from({ length: 12 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="break-inside-avoid mb-6"
              >
                <div
                  className={`backdrop-blur-xl border rounded-2xl shadow-lg overflow-hidden ${
                    currentTheme === 'dark'
                      ? 'bg-white/10 border-white/20'
                      : 'bg-white/20 border-white/30'
                  }`}
                >
                  <Card className="animate-pulse bg-transparent border-0">
                    <CardContent className="p-6">
                      <div
                        className={`h-6 rounded w-3/4 mb-2 ${
                          currentTheme === 'dark' ? 'bg-white/20' : 'bg-gray-300/50'
                        }`}
                      />
                      <div
                        className={`h-4 rounded w-full mb-2 ${
                          currentTheme === 'dark' ? 'bg-white/15' : 'bg-gray-300/40'
                        }`}
                      />
                      <div
                        className={`h-4 rounded w-2/3 mb-4 ${
                          currentTheme === 'dark' ? 'bg-white/15' : 'bg-gray-300/40'
                        }`}
                      />
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-4">
                          <div
                            className={`h-4 w-16 rounded ${
                              currentTheme === 'dark' ? 'bg-white/15' : 'bg-gray-300/40'
                            }`}
                          />
                          <div
                            className={`h-4 w-16 rounded ${
                              currentTheme === 'dark' ? 'bg-white/15' : 'bg-gray-300/40'
                            }`}
                          />
                        </div>
                        <div
                          className={`h-8 w-20 rounded ${
                            currentTheme === 'dark' ? 'bg-white/15' : 'bg-gray-300/40'
                          }`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>
        ) : filteredTracks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`text-center py-16 backdrop-blur-xl border rounded-2xl shadow-lg max-w-lg mx-auto ${
              currentTheme === 'dark'
                ? 'bg-white/10 border-white/20'
                : 'bg-white/20 border-white/30'
            }`}
          >
            <Music
              className={`w-20 h-20 mx-auto mb-6 ${
                currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}
            />
            <h2
              className={`text-3xl font-bold mb-4 ${
                currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              {searchTerm ? '未找到匹配的曲目' : '暂无曲目'}
            </h2>
            <p
              className={`mb-8 text-lg ${
                currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              {searchTerm ? '尝试使用其他关键词搜索' : '目前还没有任何曲目，请稍后再来查看'}
            </p>
            {searchTerm && (
              <Button onClick={() => setSearchTerm('')} variant="outline" size="lg">
                清除搜索
              </Button>
            )}
          </motion.div>
        ) : (
          <>
            <AnimatePresence>
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 max-w-5xl mx-auto">
                {filteredTracks.map((track, index) => (
                  <TrackCard
                     key={track.id}
                     track={track}
                     index={index}
                     currentTheme={currentTheme || 'dark'}
                     getDescriptionText={getDescriptionText}
                   />
                ))}
              </div>
            </AnimatePresence>

            {/* 无限滚动触发器和加载指示器 */}
            {hasMore && !searchTerm && (
              <div ref={observerRef} className="text-center py-12">
                {loadingMore && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex items-center justify-center gap-3 ${
                      currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-lg">加载更多曲目...</span>
                  </motion.div>
                )}
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  )
}
