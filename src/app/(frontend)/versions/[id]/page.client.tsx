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
import { ArrowLeft, Music, Heart, Download, Calendar, User, Tag, FileText, Eye } from 'lucide-react'
import { getClientSideURL } from '@/utilities/getURL'
import { CommentSection } from '@/app/(frontend)/components/CommentSection'

interface Track {
  id: string
  title: string
  slug: string
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

interface Score {
  id: string
  description: string
  track_version: string | TrackVersion
  uploader: any
  alt: string
  url: string
  filename: string
  mimeType: string
  filesize: number
  createdAt: string
}

interface VersionDetailClientProps {
  version: TrackVersion
  initialScores: Score[]
}

const payloadUrl = getClientSideURL()

export const VersionDetailClient: React.FC<VersionDetailClientProps> = ({
  version,
  initialScores,
}) => {
  const [scores, setScores] = useState<Score[]>(initialScores)
  const [loading, setLoading] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(version.likes?.length || 0)

  // 获取点赞状态
  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`${payloadUrl}/api/versions/${version.id}/like`, {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        setLikeCount(data.likeCount)
      }
    } catch (error) {
      console.error('获取点赞状态失败:', error)
    }
  }

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

  // 获取曲目信息
  const getTrackInfo = (track: string | Track) => {
    if (typeof track === 'string') {
      return { id: track, title: '未知曲目', slug: '' }
    }
    return track
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 初始化时获取点赞状态
  useEffect(() => {
    fetchLikeStatus()
  }, [])

  // 处理点赞
  const handleLike = async () => {
    try {
      const response = await fetch(`${payloadUrl}/api/versions/${version.id}/like`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '点赞失败')
      }

      const data = await response.json()
      setLiked(data.liked)
      setLikeCount(data.likeCount)
    } catch (error) {
      console.error('点赞失败:', error)
      // 如果是未登录错误，可以提示用户登录
      if (error instanceof Error && error.message.includes('未登录')) {
        alert('请先登录后再点赞')
      } else {
        alert('点赞失败，请稍后重试')
      }
    }
  }

  const trackInfo = getTrackInfo(version.track)

  return (
    <div className="min-h-screen relative">
      {/* 动态背景 - 固定定位 */}
      <div className="fixed inset-0 -z-10">
        <div
          className={`absolute inset-0 transition-all duration-1000 ${'bg-gradient-to-br from-slate-100 via-blue-50/30 to-purple-50/30 dark:from-slate-800 dark:via-blue-900/20 dark:to-purple-900/20'}`}
        />

        {/* 动态渐变带 */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full opacity-40 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"
          style={{ willChange: 'background' }}
          animate={{
            background: [
              'linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))',
              'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
              'linear-gradient(225deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2), rgba(59, 130, 246, 0.2))',
              'linear-gradient(315deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))',
            ],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* 波浪动画层 */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)',
            willChange: 'background',
          }}
          animate={{
            background: [
              'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
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
              willChange: 'transform',
            }}
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 5,
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
            background: `radial-gradient(ellipse at center, 
              transparent 30%, 
              rgba(0, 0, 0, 0.1) 70%, 
              rgba(0, 0, 0, 0.3) 100%)`,
          }}
        />
      </div>

      {/* 可滚动内容区域 */}
      <div className="relative z-10 min-h-screen overflow-y-auto">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* 返回按钮 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href={`/`}>
              <Button className="mb-4 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0 rounded-xl py-3 px-6 font-medium transition-all duration-300 backdrop-blur-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回曲目详情
              </Button>
            </Link>
          </motion.div>

          {/* 版本信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/3 dark:from-gray-800/5 dark:to-gray-900/3 border border-white/10 dark:border-gray-700/20 rounded-2xl shadow-xl p-8"
          >
            <div className="space-y-6">
              {/* 标题和基本信息 */}
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {version.title}
                </h1>
                <p className="text-lg text-muted-foreground">
                  来自曲目:{' '}
                  <Link href={`/`} className="text-blue-600 hover:underline">
                    {trackInfo.title}
                  </Link>
                </p>
                <p className="text-muted-foreground max-w-3xl mx-auto">
                  {getDescriptionText(version.notes)}
                </p>
              </div>

              {/* 详细信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center space-y-2">
                  <User className="w-8 h-8 mx-auto text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">创建者</p>
                    <p className="font-semibold">{getCreatorName(version.creator)}</p>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">创建时间</p>
                    <p className="font-semibold">{formatDate(version.createdAt)}</p>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <Heart className="w-8 h-8 mx-auto text-red-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">点赞数</p>
                    <p className="font-semibold">{likeCount}</p>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">乐谱文件</p>
                    <p className="font-semibold">{scores.length} 个</p>
                  </div>
                </div>
              </div>

              {/* 标签 */}
              {getTagNames(version.tags).length > 0 && (
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                    <Tag className="w-4 h-4" />
                    <span>标签</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {getTagNames(version.tags).map((tagName, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {tagName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleLike}
                  className={`border-0 rounded-xl py-2 px-4 font-medium transition-all duration-300 ${
                    liked
                      ? 'bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800 text-white'
                      : 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 mr-2 ${liked ? 'fill-current' : ''}`} />
                  {liked ? '已点赞' : '点赞'}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* 乐谱文件列表 */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold mb-6">乐谱文件</h2>
            </motion.div>

            {scores.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center py-12 backdrop-blur-xl bg-gradient-to-br from-white/90 to-white/70 dark:from-white/25 dark:to-white/15 border border-white/60 dark:border-white/30 rounded-2xl shadow-xl"
              >
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">暂无乐谱文件</h3>
                <p className="text-muted-foreground">该版本还没有上传任何乐谱文件</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {scores.map((score, index) => (
                    <motion.div
                      key={score.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{
                        y: -5,
                        transition: { duration: 0.3 },
                      }}
                      className="backdrop-blur-xl bg-gradient-to-br from-white/25 to-white/15 dark:from-white/20 dark:to-white/10 border border-white/30 dark:border-white/25 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/30 dark:hover:bg-white/25"
                    >
                      <Card className="h-full bg-transparent border-0">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            {score.filename || '乐谱文件'}
                          </CardTitle>
                          {score.description && (
                            <CardDescription className="text-sm text-muted-foreground">
                              {score.description}
                            </CardDescription>
                          )}
                        </CardHeader>

                        <CardContent className="space-y-3">
                          {/* 文件信息 */}
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex justify-between">
                              <span>文件大小:</span>
                              <span>{formatFileSize(score.filesize)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>文件类型:</span>
                              <span>{score.mimeType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>上传时间:</span>
                              <span>{formatDate(score.createdAt)}</span>
                            </div>
                            {score.uploader && (
                              <div className="flex justify-between">
                                <span>上传者:</span>
                                <span>{getCreatorName(score.uploader)}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>

                        <CardFooter className="pt-4 border-t border-white/20">
                          <div className="flex gap-2 w-full">
                            <Button className="flex-1 bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-700 hover:to-blue-800 text-white border-0 rounded-xl py-2 font-medium transition-all duration-300">
                              <Eye className="w-4 h-4 mr-2" />
                              预览
                            </Button>
                            <Button
                              className="bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white border-0 rounded-xl p-2 transition-all duration-300"
                              size="icon"
                            >
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
            <CommentSection trackVersionId={version.id} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
