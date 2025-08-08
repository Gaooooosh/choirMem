'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/providers/Auth'
import { useTheme } from '@/providers/Theme'
import { formatDateTime } from '@/utilities/formatDateTime'
import RichText from '@/components/RichText'

interface Article {
  id: number
  title: string
  author: {
    id: number
    username?: string
    email: string
  }
  content: any
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
  const isAuthor = user?.id === (typeof article.author === 'object' ? article.author.id : article.author);

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
        >
          <Card className={isDark ? "bg-white/5 border-white/10 backdrop-blur-md" : "bg-white/60 border-white/30 backdrop-blur-md shadow-xl"}>
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

            <CardContent className="p-6 md:p-8">
              {/* 文章标题 */}
              <h1 className={`text-3xl md:text-4xl font-bold mb-6 leading-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {article.title}
              </h1>

              {/* 文章元信息 */}
              <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b ${
                  isDark ? 'border-white/10' : 'border-gray-200'
                }`}>
                <div className={`flex flex-col md:flex-row md:items-center gap-4 text-sm ${
                  isDark ? 'text-white/60' : 'text-gray-600'
                }`}>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{article.author.username || article.author.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateTime(article.createdAt)}</span>
                  </div>
                  {article.updatedAt !== article.createdAt && (
                    <div className={isDark ? "text-white/50" : "text-gray-500"}>更新于 {formatDateTime(article.updatedAt)}</div>
                  )}
                </div>

                {/* 编辑按钮 */}
                {isAuthor && (
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
              </div>



              {/* 文章正文 */}
              <div className={`prose prose-lg max-w-none ${
                isDark ? 'prose-invert' : 'prose-gray'
              }`}>
                <RichText data={article.content} />
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