'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Music, Users, Heart, Download, Calendar, User, Tag } from 'lucide-react'
import { getClientSideURL } from '@/utilities/getURL'
import { CommentSection } from '@/app/(frontend)/components/CommentSection'

interface Track {
  id: string
  title: string
  description: any
  slug: string
  createdAt: string
}

interface TrackVersion {
  id: string
  title: string
  notes: any
  track: string | Track
  creator: any
  tags: any[]
  likes: any[]
  ratings: any[]
  createdAt: string
}

interface TrackDetailClientProps {
  track: Track
  initialVersions: TrackVersion[]
}

const payloadUrl = getClientSideURL()

export const TrackDetailClient: React.FC<TrackDetailClientProps> = ({ track, initialVersions }) => {
  const [versions, setVersions] = useState<TrackVersion[]>(initialVersions)
  const [loading, setLoading] = useState(false)

  // 提取描述文本
  const getDescriptionText = (description: any) => {
    if (!description) return '暂无描述'

    if (typeof description === 'string') {
      return description.replace(/<[^>]*>/g, '')
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
      return text
    }

    return '暂无描述'
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // 获取创建者名称
  const getCreatorName = (creator: any) => {
    if (!creator) return '未知用户'
    if (typeof creator === 'string') return creator
    return creator.name || creator.email || '未知用户'
  }

  // 获取标签名称
  const getTagNames = (tags: any[]) => {
    if (!tags || !Array.isArray(tags)) return []
    return tags.map((tag) => {
      if (typeof tag === 'string') return tag
      return tag.name || '未知标签'
    })
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 动态背景 */}
      <div className="absolute inset-0 -z-10">
        <div className={`absolute inset-0 transition-all duration-1000 ${
          'bg-gradient-to-br from-slate-100 via-blue-50/30 to-purple-50/30 dark:from-slate-800 dark:via-blue-900/20 dark:to-purple-900/20'
        }`} />
        
        {/* 动态渐变带 */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full opacity-40 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"
          animate={{
            background: [
              'linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))',
              'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
              'linear-gradient(225deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2), rgba(59, 130, 246, 0.2))',
              'linear-gradient(315deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))'
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* 波浪动画层 */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)'
          }}
          animate={{
            background: [
              'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)'
            ]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* 静态噪点纹理层 */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: '150px 150px',
          }}
        />
        
        {/* 主要弥散光晕层 */}
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={`diffuse-orb-${i}`}
            className="absolute blur-[100px] opacity-40"
            style={{
              width: `${400 + i * 200}px`,
              height: `${400 + i * 200}px`,
              left: `${20 + i * 30}%`,
              top: `${15 + i * 25}%`,
              background: `radial-gradient(circle, 
                rgba(59, 130, 246, 0.3) 0%, 
                rgba(147, 51, 234, 0.2) 50%, 
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
            background: `linear-gradient(45deg, 
              rgba(59, 130, 246, 0.2) 0%, 
              rgba(147, 51, 234, 0.3) 50%, 
              rgba(236, 72, 153, 0.2) 100%)`,
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
            background: `radial-gradient(ellipse at center, 
              transparent 30%, 
              rgba(0, 0, 0, 0.1) 70%, 
              rgba(0, 0, 0, 0.3) 100%)`,
          }}
        />
      </div>
      
      <div className="container mx-auto px-4 py-8 space-y-8 relative z-10">
      {/* 返回按钮 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/">
          <Button className="mb-4 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0 rounded-xl py-3 px-6 font-medium transition-all duration-300 backdrop-blur-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Link>
      </motion.div>

      {/* 曲目信息 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-900/20 dark:to-gray-900/10 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl shadow-black/10 p-8"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {track.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {getDescriptionText(track.description)}
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>创建于 {formatDate(track.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              <span>{versions.length} 个版本</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 版本列表 */}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-6">版本列表</h2>
        </motion.div>

        {versions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12 backdrop-blur-xl bg-gradient-to-br from-white/60 to-white/40 dark:from-gray-800/60 dark:to-gray-900/40 border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-xl"
          >
            <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">暂无版本</h3>
            <p className="text-muted-foreground">该曲目还没有任何版本，请稍后再来查看</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {versions.map((version, index) => (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{
                    y: -5,
                    transition: { duration: 0.3 },
                  }}
                  className="backdrop-blur-xl bg-gradient-to-br from-white/25 to-white/15 dark:from-white/20 dark:to-white/10 border border-white/30 dark:border-white/25 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden hover:shadow-2xl hover:shadow-black/30 transition-all duration-300 hover:bg-white/30 dark:hover:bg-white/25"
                >
                  <Card className="h-full bg-transparent border-0">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-semibold">{version.title}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {getDescriptionText(version.notes)}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* 创建者信息 */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>创建者: {getCreatorName(version.creator)}</span>
                      </div>

                      {/* 标签 */}
                      {getTagNames(version.tags).length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Tag className="w-4 h-4" />
                          <div className="flex flex-wrap gap-1">
                            {getTagNames(version.tags).map((tagName, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                              >
                                {tagName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 统计信息 */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{version.likes?.length || 0} 点赞</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(version.createdAt)}</span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-4 border-t border-white/20">
                      <div className="flex gap-2 w-full">
                        <Link href={`/versions/${version.id}`} className="flex-1">
                          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0 rounded-xl py-2 font-medium transition-all duration-300">
                            查看详情
                          </Button>
                        </Link>
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white border-0 rounded-xl p-2 transition-all duration-300" size="icon">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 评论区 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-900/20 dark:to-gray-900/10 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl shadow-black/10 p-8"
      >
        <CommentSection trackId={track.id} showAggregated={true} />
      </motion.div>
      </div>
    </div>
  )
}