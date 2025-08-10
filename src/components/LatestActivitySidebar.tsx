'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, Calendar, User, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'

interface Comment {
  id: number
  body: string
  author: {
    id: number
    username?: string
    email: string
  }
  track?: {
    id: number
    title: string
  }
  track_version?: {
    id: number
    title: string
    track?: {
      id: number
      title: string
    }
  }
  createdAt: string
}

interface LatestActivitySidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function LatestActivitySidebar({ isOpen, onClose }: LatestActivitySidebarProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 获取所有评论
  const fetchAllComments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/comments?depth=3&sort=-createdAt&limit=50')
      
      if (response.ok) {
        const data = await response.json()
        console.log('评论数据:', data)
        setComments(data.docs || [])
      } else {
        console.error('API 响应错误:', response.status, response.statusText)
        const errorData = await response.text()
        console.error('错误详情:', errorData)
      }
    } catch (error) {
      console.error('获取评论失败:', error)
      // 设置空数组以避免渲染错误
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchAllComments()
    }
  }, [isOpen])

  // 获取用户显示名称
  const getUserDisplayName = (author: Comment['author']) => {
    if (!author) return '匿名用户'
    return author.username || (author.email ? author.email.split('@')[0] : '匿名用户')
  }

  // 获取用户头像字母
  const getUserInitials = (author: Comment['author']) => {
    const name = getUserDisplayName(author)
    return name.charAt(0).toUpperCase()
  }

  // 获取评论关联的内容信息
  const getCommentContext = (comment: Comment) => {
    if (comment.track_version) {
      return {
        type: 'version',
        title: comment.track_version.title,
        trackTitle: comment.track_version.track?.title,
        link: `/tracks/${comment.track_version.track?.id}/versions/${comment.track_version.id}`
      }
    } else if (comment.track) {
      return {
        type: 'track',
        title: comment.track.title,
        link: `/tracks/${comment.track.id}`
      }
    }
    return null
  }

  return (
    <>
      {/* 背景遮罩 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-3xl backdrop-saturate-200 backdrop-contrast-150 backdrop-brightness-75 z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* 侧边栏 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-96 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[40px] backdrop-saturate-[250%] backdrop-contrast-[175%] backdrop-brightness-110 border-l border-white/40 dark:border-gray-700/50 z-50 shadow-2xl"
          >
            {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200/20 dark:border-gray-700/20 bg-black/10 dark:bg-black/20 backdrop-blur-2xl backdrop-saturate-200 backdrop-contrast-150 backdrop-brightness-110">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm">
                  <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  最新动态
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto relative">
              {/* 毛玻璃背景层 */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-white/5 dark:from-gray-800/30 dark:via-gray-800/20 dark:to-gray-800/10 backdrop-blur-xl backdrop-saturate-200 backdrop-contrast-125"></div>
              
              {/* 内容层 */}
              <div className="relative z-10 p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                     <div key={i} className="animate-pulse">
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-100/40 dark:bg-gray-800/40 backdrop-blur-md">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-gray-100/40 to-gray-200/20 dark:from-gray-800/40 dark:to-gray-900/20 backdrop-blur-md w-fit mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">暂无评论动态</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => {
                    const context = getCommentContext(comment)
                    return (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-4 rounded-xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-md backdrop-saturate-150 border border-white/40 dark:border-gray-700/40 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200"
                      >
                        <div className="flex items-start gap-3">
                          <Link href={`/users/${comment.author.id}`} onClick={onClose}>
                            <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all">
                              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 text-blue-600 dark:text-blue-300 text-sm">
                                {getUserInitials(comment.author)}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          
                          <div className="flex-1 space-y-2">
                            {/* 用户信息和时间 */}
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                {getUserDisplayName(comment.author)}
                              </span>
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="w-3 h-3" />
                                {formatDistanceToNow(new Date(comment.createdAt), {
                                  addSuffix: true,
                                  locale: zhCN
                                })}
                              </div>
                            </div>

                            {/* 评论内容 */}
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {comment.body}
                            </p>

                            {/* 关联内容 */}
                            {context && (
                              <Link
                                href={context.link}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100/40 dark:bg-blue-900/20 backdrop-blur-sm text-blue-800 dark:text-blue-300 rounded-lg text-xs hover:bg-blue-200/60 dark:hover:bg-blue-900/40 transition-colors"
                                onClick={onClose}
                              >
                                <Music className="w-3 h-3" />
                                {context.type === 'version' ? (
                                  <span>
                                    {context.trackTitle} - {context.title}
                                  </span>
                                ) : (
                                  <span>{context.title}</span>
                                )}
                              </Link>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}