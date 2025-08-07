'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, User, Calendar, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/providers/Auth'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Comment {
  id: number
  body: string
  author: {
    id: number
    name?: string
    email: string
  }
  track?: {
    id: number
    title: string
  }
  track_version?: {
    id: number
    title: string
  }
  createdAt: string
  updatedAt: string
}

interface CommentSectionProps {
  trackId?: string
  trackVersionId?: string
  className?: string
  showAggregated?: boolean // 新增：是否显示聚合评论
}

export function CommentSection({ trackId, trackVersionId, className = '', showAggregated = false }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [trackVersions, setTrackVersions] = useState<any[]>([])
  const { user } = useAuth()

  // 获取曲目的所有版本
  const fetchTrackVersions = async () => {
    if (!trackId || !showAggregated) return []
    
    try {
      const response = await fetch(`/api/track-versions?where[track][equals]=${trackId}&depth=1&limit=1000`)
      if (response.ok) {
        const data = await response.json()
        return data.docs || []
      }
    } catch (error) {
      console.error('获取版本列表失败:', error)
    }
    return []
  }

  // 获取评论列表
  const fetchComments = async () => {
    try {
      setIsLoading(true)
      
      // 如果是聚合模式且是曲目页面，获取曲目的所有版本
      let versions: any[] = []
      if (trackId && showAggregated) {
        versions = await fetchTrackVersions()
        setTrackVersions(versions)
      }
      
      // 获取所有评论
      const response = await fetch(`/api/comments?depth=2&sort=-createdAt&limit=1000`)
      
      if (response.ok) {
        const data = await response.json()
        const allComments = data.docs || []
        
        // 客户端过滤评论
        const filteredComments = allComments.filter((comment: any) => {
          if (trackId && showAggregated) {
            // 聚合模式：显示曲目评论 + 所有版本评论
            if (comment.track && comment.track.id === parseInt(trackId)) {
              return true
            }
            if (comment.track_version) {
              return versions.some(v => v.id === comment.track_version.id)
            }
            return false
          } else if (trackId) {
            // 只显示曲目评论
            return comment.track && comment.track.id === parseInt(trackId)
          } else if (trackVersionId) {
            // 只显示版本评论
            return comment.track_version && comment.track_version.id === parseInt(trackVersionId)
          }
          return false
        })
        
        setComments(filteredComments)
      }
    } catch (error) {
      console.error('获取评论失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 提交新评论
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user || isSubmitting) return

    try {
      setIsSubmitting(true)
      const commentData = {
        body: newComment.trim(),
        author: user.id,
        ...(trackId ? { track: parseInt(trackId) } : { track_version: parseInt(trackVersionId || '') })
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      })

      if (response.ok) {
        setNewComment('')
        await fetchComments() // 重新获取评论列表
      } else {
        throw new Error('提交评论失败')
      }
    } catch (error) {
      console.error('提交评论失败:', error)
      alert('提交评论失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 删除评论
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('确定要删除这条评论吗？')) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchComments()
      } else {
        throw new Error('删除评论失败')
      }
    } catch (error) {
      console.error('删除评论失败:', error)
      alert('删除评论失败，请稍后重试')
    }
  }

  // 删除评论（只有管理员和作者可以删除）
  const canDeleteComment = (comment: Comment) => {
    if (!user) return false
    // 检查是否是评论作者或管理员
    return String(user.id) === String(comment.author.id) || user.is_admin
  }

  // 获取用户显示名称
  const getUserDisplayName = (author: Comment['author']) => {
    if (!author) return '匿名用户'
    return author.name || (author.email ? author.email.split('@')[0] : '匿名用户')
  }

  // 获取用户头像字母
  const getUserInitials = (author: Comment['author']) => {
    const name = getUserDisplayName(author)
    return name.charAt(0).toUpperCase()
  }

  useEffect(() => {
    fetchComments()
  }, [trackId, trackVersionId])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 评论标题 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm">
          <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          {showAggregated && trackId ? '所有评论' : '评论'} ({comments.length})
        </h3>
        {showAggregated && trackId && trackVersions.length > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            包含 {trackVersions.length} 个版本的评论
          </span>
        )}
      </div>

      {/* 评论表单 */}
      {user ? (
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/30 to-white/10 dark:from-white/10 dark:to-white/5 border border-white/30 dark:border-white/10 rounded-2xl p-6 shadow-lg">
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="写下你的评论..."
              className="min-h-[100px] resize-none bg-white/50 dark:bg-gray-900/50 border-white/30 dark:border-gray-700/30 rounded-xl backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-200"
              disabled={isSubmitting}
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!newComment.trim() || isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-xl px-6 py-2 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? '发布中...' : '发布评论'}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/30 to-white/10 dark:from-white/10 dark:to-white/5 border border-white/30 dark:border-white/10 rounded-2xl p-6 shadow-lg text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">请登录后发表评论</p>
          <Button variant="outline" className="border-white/30 dark:border-gray-700/30 bg-white/20 dark:bg-gray-900/20 hover:bg-white/30 dark:hover:bg-gray-900/30 rounded-xl">
            <User className="w-4 h-4 mr-2" />
            登录
          </Button>
        </div>
      )}

      {/* 评论列表 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="backdrop-blur-xl bg-gradient-to-br from-white/25 to-white/10 dark:from-white/10 dark:to-white/5 border border-white/30 dark:border-white/10 rounded-2xl p-6 shadow-lg">
                <div className="animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/30 dark:bg-gray-700/30 rounded-full" />
                    <div className="space-y-1">
                      <div className="h-4 bg-white/30 dark:bg-gray-700/30 rounded w-24" />
                      <div className="h-3 bg-white/20 dark:bg-gray-700/20 rounded w-16" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-white/30 dark:bg-gray-700/30 rounded w-full" />
                    <div className="h-4 bg-white/20 dark:bg-gray-700/20 rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/25 to-white/10 dark:from-white/10 dark:to-white/5 border border-white/30 dark:border-white/10 rounded-2xl p-8 shadow-lg text-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-gray-100/50 to-gray-200/30 dark:from-gray-800/50 dark:to-gray-900/30 w-fit mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">还没有评论，来发表第一条评论吧！</p>
          </div>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="backdrop-blur-xl bg-gradient-to-br from-white/25 to-white/10 dark:from-white/10 dark:to-white/5 border border-white/30 dark:border-white/10 rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 text-blue-600 dark:text-blue-300">
                      {getUserInitials(comment.author)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                          {getUserDisplayName(comment.author)}
                        </span>
                        {showAggregated && (comment.track_version || comment.track) && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs">
                            {comment.track_version ? `版本: ${comment.track_version.title}` : '曲目评论'}
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                            locale: zhCN
                          })}
                        </div>
                      </div>
                      
                      {canDeleteComment(comment) && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50/50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {comment.body}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}