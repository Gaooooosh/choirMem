'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../../../providers/Auth'
import { useTheme } from '@/providers/Theme'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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

export const HomeClient: React.FC<HomeClientProps> = ({ initialTracks, hasMore: initialHasMore }) => {
  const [tracks, setTracks] = useState<TrackWithStats[]>([])
  const [filteredTracks, setFilteredTracks] = useState<TrackWithStats[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [welcomeMessage, setWelcomeMessage] = useState<string>("欢迎来到合唱团记忆")
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

  // 获取曲目统计数据
  const fetchTrackStats = async (track: Track): Promise<TrackWithStats> => {
    try {
      // 获取版本数量
      const versionsResponse = await fetch(
        `${payloadUrl}/api/track-versions?where[track][equals]=${track.id}&limit=0`,
        { credentials: 'include' }
      )
      const versionsData = await versionsResponse.json()
      
      // 计算总点赞数
      let totalLikes = 0
      if (versionsData.docs && versionsData.docs.length > 0) {
        totalLikes = versionsData.docs.reduce(
          (sum: number, version: any) => sum + (version.likes?.length || 0),
          0
        )
      }
      
      return {
        ...track,
        versionCount: versionsData.totalDocs || 0,
        totalLikes
      }
    } catch (error) {
      console.error('获取曲目统计数据失败:', error)
      return {
        ...track,
        versionCount: 0,
        totalLikes: 0
      }
    }
  }

  // 加载更多曲目
  const loadMoreTracks = useCallback(async () => {
    if (loadingMore || !hasMore) return
    
    try {
      setLoadingMore(true)
      const response = await fetch(
        `${payloadUrl}/api/tracks?limit=20&page=${page + 1}`,
        { credentials: 'include' }
      )
      const data = await response.json()
      
      if (data.docs.length > 0) {
        const newTracksWithStats = await Promise.all(
          data.docs.map((track: Track) => fetchTrackStats(track))
        )
        setTracks(prev => [...prev, ...newTracksWithStats])
        setPage(prev => prev + 1)
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
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [loadMoreTracks, hasMore, loadingMore])

  // 初始化数据
  useEffect(() => {
    const initializeTracks = async () => {
      setLoading(true)
      const tracksWithStats = await Promise.all(
        initialTracks.map(track => fetchTrackStats(track))
      )
      setTracks(tracksWithStats)
      setFilteredTracks(tracksWithStats)
      setLoading(false)
    }

    initializeTracks()
  }, [initialTracks])

  // 搜索过滤
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTracks(tracks)
    } else {
      const filtered = tracks.filter(track =>
        track.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredTracks(filtered)
    }
  }, [searchTerm, tracks])

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

  // 提取描述文本
  const getDescriptionText = (description: any) => {
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
  }

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
            <Button onClick={() => window.location.reload()}>
              重新加载
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 动态背景 */}
      <div className="absolute inset-0 -z-10">
        <div className={`absolute inset-0 transition-all duration-1000 ${
          currentTheme === 'dark'
            ? 'bg-gradient-to-br from-slate-800 via-blue-900/20 to-purple-900/20'
            : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
        }`} />
        
        {/* 动态渐变带 */}
        <motion.div
          className={`absolute top-0 left-0 w-full h-full opacity-40 ${
            currentTheme === 'dark'
              ? 'bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20'
              : 'bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20'
          }`}
          animate={{
            background: currentTheme === 'dark'
              ? [
                  'linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))',
                  'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
                  'linear-gradient(225deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2), rgba(59, 130, 246, 0.2))',
                  'linear-gradient(315deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))'
                ]
              : [
                  'linear-gradient(45deg, rgba(96, 165, 250, 0.3), rgba(168, 85, 247, 0.3), rgba(244, 114, 182, 0.3))',
                  'linear-gradient(135deg, rgba(244, 114, 182, 0.3), rgba(96, 165, 250, 0.3), rgba(168, 85, 247, 0.3))',
                  'linear-gradient(225deg, rgba(168, 85, 247, 0.3), rgba(244, 114, 182, 0.3), rgba(96, 165, 250, 0.3))',
                  'linear-gradient(315deg, rgba(96, 165, 250, 0.3), rgba(168, 85, 247, 0.3), rgba(244, 114, 182, 0.3))'
                ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* 波浪动画层 */}
        {mounted && (
          <motion.div
            className="absolute inset-0 overflow-hidden"
            style={{
              background: currentTheme === 'dark'
                ? 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)'
                : 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%)'
            }}
            animate={{
              background: currentTheme === 'dark'
                ? [
                    'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)'
                  ]
                : [
                    'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%)',
                    'radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.15) 0%, transparent 50%)',
                    'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%)'
                  ]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        
        {/* 简化弥散背景系统 */}
          {mounted && (
            <>
              {/* 静态噪点纹理层 */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.3'/%3E%3C/svg%3E")`,
                  backgroundSize: '150px 150px',
                }}
              />
              
              {/* 主要弥散光晕层 - 减少数量和复杂度 */}
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={`diffuse-orb-${i}`}
                  className="absolute blur-[100px] opacity-40"
                  style={{
                    width: `${400 + i * 200}px`,
                    height: `${400 + i * 200}px`,
                    left: `${20 + i * 30}%`,
                    top: `${15 + i * 25}%`,
                    background: currentTheme === 'dark'
                      ? `radial-gradient(circle, 
                          rgba(59, 130, 246, 0.3) 0%, 
                          rgba(147, 51, 234, 0.2) 50%, 
                          transparent 100%)`
                      : `radial-gradient(circle, 
                          rgba(59, 130, 246, 0.15) 0%, 
                          rgba(147, 51, 234, 0.1) 50%, 
                          transparent 100%)`,
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 20 + i * 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 3,
                  }}
                />
              ))}
              
              {/* 简化流动层 */}
              <motion.div
                className="absolute inset-0 blur-[60px] opacity-20"
                style={{
                  background: currentTheme === 'dark'
                    ? `linear-gradient(45deg, 
                        rgba(59, 130, 246, 0.2) 0%, 
                        rgba(147, 51, 234, 0.3) 50%, 
                        rgba(236, 72, 153, 0.2) 100%)`
                    : `linear-gradient(45deg, 
                        rgba(59, 130, 246, 0.1) 0%, 
                        rgba(147, 51, 234, 0.15) 50%, 
                        rgba(236, 72, 153, 0.1) 100%)`,
                }}
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 60,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              
              {/* 静态边缘渐变 */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: currentTheme === 'dark'
                    ? `radial-gradient(ellipse at center, 
                        transparent 30%, 
                        rgba(0, 0, 0, 0.1) 70%, 
                        rgba(0, 0, 0, 0.3) 100%)`
                    : `radial-gradient(ellipse at center, 
                        transparent 30%, 
                        rgba(255, 255, 255, 0.1) 70%, 
                        rgba(255, 255, 255, 0.3) 100%)`,
                }}
              />
            </>
          )}
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        {/* 页面标题和搜索 */}
        <div className="text-center space-y-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >

            
            <h1 className={`text-5xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-4 ${
              currentTheme === 'dark'
                ? 'from-blue-400 via-purple-400 to-pink-400'
                : 'from-blue-600 via-purple-600 to-pink-600'
            }`}>
              {renderWelcomeMessage()}
            </h1>
            <p className={`text-xl max-w-2xl mx-auto ${
              currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              探索丰富的合唱曲目资源，发现优美的音乐作品
            </p>
          </motion.div>

          {/* 搜索框 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-lg mx-auto relative"
          >
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'
            }`} />
            <div className="relative">
              <div className={`absolute inset-0 rounded-2xl ${
                currentTheme === 'dark'
                  ? 'bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5'
                  : 'bg-gradient-to-br from-blue-400/10 via-transparent to-purple-400/10'
              }`} />
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
                  boxShadow: currentTheme === 'dark'
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
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
                <div className={`backdrop-blur-xl border rounded-2xl shadow-xl overflow-hidden relative ${
                currentTheme === 'dark'
                  ? 'bg-gradient-to-br from-white/25 to-white/15 border-white/30'
                  : 'bg-gradient-to-br from-white/90 to-white/70 border-white/60'
              }`} style={{
                boxShadow: currentTheme === 'dark'
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
              }}>
                <div className={`absolute inset-0 rounded-2xl ${
                  currentTheme === 'dark'
                    ? 'bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5'
                    : 'bg-gradient-to-br from-blue-400/10 via-transparent to-purple-400/10'
                }`} />
                  <Card className="animate-pulse bg-transparent border-0 relative z-10">
                    <CardHeader className="pb-3">
                      <div className={`h-6 rounded w-3/4 mb-2 ${
                        currentTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                      }`} />
                      <div className={`h-4 rounded w-full ${
                        currentTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                      }`} />
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className={`h-4 rounded w-full mb-2 ${
                        currentTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                      }`} />
                      <div className={`h-4 rounded w-2/3 mb-4 ${
                        currentTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                      }`} />
                      <div className={`h-4 rounded w-1/2 ${
                        currentTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                      }`} />
                    </CardContent>
                    <CardFooter>
                      <div className={`h-10 rounded w-full ${
                        currentTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                      }`} />
                    </CardFooter>
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
            className={`text-center py-16 backdrop-blur-xl border rounded-2xl shadow-xl max-w-lg mx-auto relative ${
              currentTheme === 'dark'
                ? 'bg-gradient-to-br from-white/25 to-white/15 border-white/30'
                : 'bg-gradient-to-br from-white/90 to-white/70 border-white/60'
            }`}
            style={{
              boxShadow: currentTheme === 'dark'
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                : '0 25px 50px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
            }}
          >
            <div className={`absolute inset-0 rounded-2xl ${
              currentTheme === 'dark'
                ? 'bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5'
                : 'bg-gradient-to-br from-blue-400/10 via-transparent to-purple-400/10'
            }`} />
            <div className="relative z-10">
              <Music className={`w-20 h-20 mx-auto mb-6 ${
                currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`} />
            <h2 className={`text-3xl font-bold mb-4 ${
              currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {searchTerm ? '未找到匹配的曲目' : '暂无曲目'}
            </h2>
            <p className={`mb-8 text-lg ${
              currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {searchTerm ? '尝试使用其他关键词搜索' : '目前还没有任何曲目，请稍后再来查看'}
            </p>
              {searchTerm && (
                <Button onClick={() => setSearchTerm('')} variant="outline" size="lg">
                  清除搜索
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <>
            <AnimatePresence>
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 max-w-5xl mx-auto">
                {filteredTracks.map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    whileHover={{
                      y: -8,
                      transition: { duration: 0.3 }
                    }}
                    className="break-inside-avoid mb-6"
                  >
                    <div className={`backdrop-blur-xl border rounded-2xl shadow-xl overflow-hidden transition-all duration-300 relative ${
                      currentTheme === 'dark'
                        ? 'bg-gradient-to-br from-white/25 to-white/15 border-white/30 hover:shadow-2xl hover:from-white/30 hover:to-white/20 hover:border-white/40'
                        : 'bg-gradient-to-br from-white/90 to-white/70 border-white/60 hover:shadow-2xl hover:from-white/95 hover:to-white/80 hover:border-white/70'
                    }`} style={{
                      boxShadow: currentTheme === 'dark'
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                    }}>
                      {/* 内部光晕效果 */}
                      <div className={`absolute inset-0 rounded-2xl ${
                        currentTheme === 'dark'
                          ? 'bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5'
                          : 'bg-gradient-to-br from-blue-400/10 via-transparent to-purple-400/10'
                      }`} />
                      <Card className="bg-transparent border-0 relative z-10">
                        <CardHeader className="pb-4">
                          <CardTitle className={`text-xl font-bold line-clamp-2 ${
                            currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                          }`}>
                            {track.title}
                          </CardTitle>
                          <CardDescription className={`line-clamp-4 leading-relaxed ${
                            currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {getDescriptionText(track.description)}
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="pb-4">
                          <div className={`flex items-center gap-6 text-sm ${
                            currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>{track.versionCount} 版本</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Heart className="w-4 h-4" />
                              <span>{track.totalLikes} 点赞</span>
                            </div>
                          </div>
                        </CardContent>
                        
                        <CardFooter>
                          <Link href={`/tracks/${track.slug}`} className="w-full">
                            <Button className={`w-full border-0 rounded-xl py-3 font-medium transition-all duration-300 ${
                              currentTheme === 'dark'
                                ? 'bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white'
                                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                            }`}>
                              查看详情
                            </Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    </div>
                  </motion.div>
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
  )
}