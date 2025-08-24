'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/providers/Auth'
import { useTheme } from '@/providers/Theme'
import { formatDateTime } from '@/utilities/formatDateTime'
import RichText from '@/components/RichText'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import HTMLRenderer from '@/components/HTMLRenderer'

interface Article {
  id: number
  title: string
  author: {
    id: number
    username?: string
    email: string
  }
  content: any
  contentType?: 'richtext' | 'markdown'
  status: 'draft' | 'published'
  cover_image?: {
    id: number
    url?: string
    alt?: string
  }

  createdAt: string
  updatedAt: string
}

interface ArticleDetailClientProps {
  article: Article
}

export const ArticleDetailClient: React.FC<ArticleDetailClientProps> = ({ article }) => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const isAuthor = user?.id === (typeof article.author === 'object' ? article.author.id : article.author);
  const isAdmin = user?.is_admin || false;

  const handleDelete = async () => {
    if (!user || (!isAuthor && !isAdmin)) {
      toast({
        title: "权限不足",
        description: "您没有权限删除此文章",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast({
          title: "删除成功",
          description: "文章已成功删除",
        })
        // 重定向到文章列表页面
        window.location.href = '/articles'
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      toast({
        title: "删除失败",
        description: "删除文章时发生错误，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = mounted ? theme : 'light'
  const isDark = currentTheme === 'dark'

  return (
    <div className="min-h-screen pt-20 relative overflow-hidden">
      {/* 背景层 - 与首页保持一致 */}
      <div className="absolute inset-0 -z-10">
        <div
          className={`absolute inset-0 transition-all duration-800 ${
            isDark
              ? 'bg-gradient-to-br from-slate-800 via-blue-900/20 to-purple-900/20'
              : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
          }`}
        />
      </div>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 返回按钮 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            asChild
            className={isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-gray-600 hover:text-gray-900 hover:bg-black/5"}
          >
            <Link href="/articles" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回文章列表
            </Link>
          </Button>
        </motion.div>

        {/* 文章内容 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto px-4 md:px-6"
        >
          <Card className={isDark ? "bg-white/5 border-white/10 backdrop-blur-md rounded-2xl overflow-hidden" : "bg-white/60 border-white/30 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden"}>
            {/* 封面图片 */}
            {article.cover_image?.url && (
              <div className="w-full h-64 md:h-80 overflow-hidden rounded-t-lg">
                <img
                  src={article.cover_image.url}
                  alt={article.cover_image.alt || article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <CardContent className="p-0">
              {/* 文章标题和元信息 */}
              <div className="px-8 md:px-12 pt-8 pb-6">
                <h1 className={`text-4xl md:text-5xl font-bold mb-6 leading-tight tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {article.title}
                </h1>
                
                <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b ${
                    isDark ? 'border-white/10' : 'border-gray-200'
                  }`}>
                  <div className={`flex flex-col md:flex-row md:items-center gap-4 text-sm ${
                    isDark ? 'text-white/60' : 'text-gray-600'
                  }`}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{article.author.username || article.author.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDateTime(article.createdAt)}</span>
                    </div>
                    {article.updatedAt !== article.createdAt && (
                      <div className={isDark ? "text-white/50" : "text-gray-500"}>更新于 {formatDateTime(article.updatedAt)}</div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                {(isAuthor || isAdmin) && (
                  <div className="flex gap-2">
                    {/* 编辑按钮 */}
                    {(isAuthor || isAdmin) && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className={isDark ? "border-white/20 text-white hover:bg-white/10" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
                      >
                        <Link href={`/articles/${article.id}/edit`} className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          编辑文章
                        </Link>
                      </Button>
                    )}
                    
                    {/* 删除按钮 */}
                    {(isAuthor || isAdmin) && (
                      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={isDark ? "border-red-500/50 text-red-400 hover:bg-red-500/10" : "border-red-300 text-red-600 hover:bg-red-50"}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            删除文章
                          </Button>
                        </DialogTrigger>
                      <DialogContent className={isDark ? "bg-gray-900 border-gray-700" : "bg-white"}>
                        <DialogHeader>
                          <DialogTitle className={isDark ? "text-white" : "text-gray-900"}>
                            确认删除文章
                          </DialogTitle>
                          <DialogDescription className={isDark ? "text-gray-300" : "text-gray-600"}>
                            您确定要删除文章「{article.title}」吗？此操作无法撤销。
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            className={isDark ? "border-gray-600 text-gray-300 hover:bg-gray-800" : ""}
                          >
                            取消
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "删除中..." : "确认删除"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    )}
                  </div>
                )}
                </div>
              </div>

              {/* 文章正文 */}
              <div className="px-6 md:px-8 lg:px-12 pb-8">
                {article.contentType === 'markdown' ? (
                  <MarkdownRenderer 
                    content={typeof article.content === 'string' ? article.content : JSON.stringify(article.content)} 
                    className={`markdown-article-content leading-relaxed ${
                      isDark ? 'prose-invert' : 'prose-gray'
                    }`}
                  />
                ) : (
                  // Check if content is HTML string or Lexical state
                  typeof article.content === 'string' ? (
                    <HTMLRenderer 
                      content={article.content}
                      className={isDark ? 'prose-invert' : 'prose-gray'}
                    />
                  ) : (
                    <RichText 
                      data={article.content}
                      className={isDark ? 'prose-invert' : 'prose-gray'}
                    />
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 相关操作 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 text-center"
        >
          <Button
            variant="outline"
            asChild
            className={isDark ? "border-white/20 text-white hover:bg-white/10" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
          >
            <Link href="/articles">查看更多文章</Link>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}