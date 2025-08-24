'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Calendar, User, Plus, Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/providers/Auth'
import { useTheme } from '@/providers/Theme'
import { formatDateTime } from '@/utilities/formatDateTime'
import HTMLRenderer from '@/components/HTMLRenderer'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

interface Article {
  id: number
  title: string
  author: {
    id: number
    username?: string
    email: string
  }
  content: any
  contentType: 'richtext' | 'markdown'
  status: 'draft' | 'published'
  cover_image?: {
    id: number
    url?: string | null
    alt?: string | null
  }
  createdAt: string
  updatedAt: string
}

interface ArticlesClientProps {
  articles: {
    docs: Article[]
    totalDocs: number
    limit: number
    totalPages: number
    page: number
    pagingCounter: number
    hasPrevPage: boolean
    hasNextPage: boolean
    prevPage: number | null
    nextPage: number | null
  }
}

export const ArticlesClient: React.FC<ArticlesClientProps> = ({ articles }) => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  const currentTheme = mounted ? theme : 'light'

  const filteredArticles = articles.docs.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.author.username || article.author.email)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  )

  const getExcerpt = (content: any, contentType: 'richtext' | 'markdown') => {
    if (!content) return ''
    
    if (contentType === 'markdown') {
      // For markdown content, return a limited markdown snippet
      const textContent = typeof content === 'string' ? content : JSON.stringify(content)
      // Get first 150 characters while preserving some markdown
      const limitedContent = textContent.length > 150 ? textContent.substring(0, 150) + '...' : textContent
      return limitedContent
    }
    
    // For richtext content
    if (typeof content === 'string') {
      // Handle HTML string content - preserve some basic HTML but limit length
      const htmlContent = content
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/&amp;/g, '&') // Replace HTML entities
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
      
      // Create a safe excerpt by keeping basic HTML tags but limiting content
      if (htmlContent.length > 200) {
        const truncated = htmlContent.substring(0, 200)
        // Try to close any open tags to prevent broken HTML
        const lastOpenTag = truncated.lastIndexOf('<')
        const lastCloseTag = truncated.lastIndexOf('>')
        
        if (lastOpenTag > lastCloseTag) {
          // There's an unclosed tag, truncate before it
          return htmlContent.substring(0, lastOpenTag) + '...'
        }
        return truncated + '...'
      }
      return htmlContent
    }
    
    // For Lexical richtext content (object format) - convert to HTML excerpt
    if (!content.root || !content.root.children) return ''

    const convertNodesToHtml = (nodes: any[]): string => {
      return nodes.map(node => {
        if (node.type === 'paragraph') {
          const content = node.children ? convertNodesToHtml(node.children) : ''
          return `<p>${content}</p>`
        }
        if (node.type === 'text') {
          let text = node.text || ''
          // Apply basic formatting
          if (node.format & 1) text = `<strong>${text}</strong>` // bold
          if (node.format & 2) text = `<em>${text}</em>` // italic
          return text
        }
        if (node.type === 'heading') {
          const content = node.children ? convertNodesToHtml(node.children) : ''
          const tag = node.tag || 'h1'
          return `<${tag}>${content}</${tag}>`
        }
        // For other types, just extract text content
        if (node.children) {
          return convertNodesToHtml(node.children)
        }
        return ''
      }).join('')
    }

    const htmlContent = convertNodesToHtml(content.root.children)
    
    // Limit the HTML content length
    if (htmlContent.length > 200) {
      const truncated = htmlContent.substring(0, 200)
      const lastOpenTag = truncated.lastIndexOf('<')
      const lastCloseTag = truncated.lastIndexOf('>')
      
      if (lastOpenTag > lastCloseTag) {
        return htmlContent.substring(0, lastOpenTag) + '...'
      }
      return truncated + '...'
    }
    
    return htmlContent
  }

  return (
    <div className="min-h-screen relative overflow-hidden pt-20">
      {/* 背景层 - 与首页保持一致 */}
      <div className="absolute inset-0 -z-10">
        <div
          className={`absolute inset-0 transition-all duration-800 ${
            currentTheme === 'dark'
              ? 'bg-gradient-to-br from-slate-800 via-blue-900/20 to-purple-900/20'
              : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
          }`}
        />
      </div>
      {/* 动态背景层 */}
      {mounted && (
        <>
          {/* 多色弥散光晕层 */}
          {Array.from({ length: 4 }).map((_, i) => {
            const colors = currentTheme === 'dark' 
              ? [
                  'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.2) 50%, transparent 100%)',
                  'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, rgba(168, 85, 247, 0.18) 50%, transparent 100%)',
                  'radial-gradient(circle, rgba(34, 197, 94, 0.22) 0%, rgba(59, 130, 246, 0.16) 50%, transparent 100%)',
                  'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(34, 197, 94, 0.18) 50%, transparent 100%)'
                ]
              : [
                  'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.15) 50%, transparent 100%)',
                  'radial-gradient(circle, rgba(236, 72, 153, 0.18) 0%, rgba(168, 85, 247, 0.12) 50%, transparent 100%)',
                  'radial-gradient(circle, rgba(34, 197, 94, 0.16) 0%, rgba(59, 130, 246, 0.12) 50%, transparent 100%)',
                  'radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, rgba(34, 197, 94, 0.14) 50%, transparent 100%)'
                ];
            
            const positions = [
              { left: '20%', top: '25%', size: 350 },
              { left: '70%', top: '20%', size: 300 },
              { left: '15%', top: '75%', size: 280 },
              { left: '75%', top: '70%', size: 320 }
            ];
            
            return (
              <motion.div
                key={`article-orb-${i}`}
                className="absolute blur-[100px] opacity-70"
                style={{
                  width: `${positions[i].size}px`,
                  height: `${positions[i].size}px`,
                  left: positions[i].left,
                  top: positions[i].top,
                  background: colors[i],
                  willChange: 'transform',
                }}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 2,
                }}
              />
            );
           })}

          {/* 波浪动画层 */}
          <motion.div
            className="absolute inset-0 overflow-hidden opacity-30"
            style={{
              background: currentTheme === 'dark'
                ? 'radial-gradient(circle at 30% 70%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255, 119, 198, 0.12) 0%, transparent 50%)'
                : 'radial-gradient(circle at 30% 70%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255, 119, 198, 0.08) 0%, transparent 50%)',
              willChange: 'background',
            }}
            animate={{
              background: currentTheme === 'dark'
                ? [
                    'radial-gradient(circle at 30% 70%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255, 119, 198, 0.12) 0%, transparent 50%)',
                    'radial-gradient(circle at 70% 70%, rgba(255, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 30% 30%, rgba(120, 119, 198, 0.12) 0%, transparent 50%)',
                    'radial-gradient(circle at 30% 70%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255, 119, 198, 0.12) 0%, transparent 50%)'
                  ]
                : [
                    'radial-gradient(circle at 30% 70%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255, 119, 198, 0.08) 0%, transparent 50%)',
                    'radial-gradient(circle at 70% 70%, rgba(255, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 30% 30%, rgba(120, 119, 198, 0.08) 0%, transparent 50%)',
                    'radial-gradient(circle at 30% 70%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255, 119, 198, 0.08) 0%, transparent 50%)'
                  ]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </>
      )}

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* 页面标题和操作区域 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6"
        >
          <div className="space-y-3">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`text-5xl font-bold bg-gradient-to-r ${
                currentTheme === 'dark'
                  ? 'from-blue-400 via-purple-400 to-pink-400'
                  : 'from-blue-600 via-purple-600 to-pink-600'
              } bg-clip-text text-transparent`}
            >
              署名文章
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`text-lg ${
                currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              合唱团成员的心得分享与经验交流
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center gap-4"
          >
            {/* 搜索框 */}
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <Input
                placeholder="搜索文章或作者..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 w-64 backdrop-blur-xl border transition-all duration-300 ${
                  currentTheme === 'dark'
                    ? 'bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/15 focus:border-white/30'
                    : 'bg-white/30 border-white/40 text-gray-900 placeholder:text-gray-500 focus:bg-white/40 focus:border-white/50'
                }`}
              />
            </div>

            {/* 发表文章按钮 */}
            {user && (
              <Button
                asChild
                size="lg"
                className={`backdrop-blur-xl border transition-all duration-300 hover:scale-105 shadow-lg ${
                  currentTheme === 'dark'
                    ? 'bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-600/90 hover:to-purple-700/90 border-white/20 text-white shadow-blue-500/25'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-white/30 text-white shadow-blue-500/30'
                }`}
              >
                <Link href="/articles/new" className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  发表文章
                </Link>
              </Button>
            )}
          </motion.div>
        </motion.div>

        {/* 文章列表 */}
        <div className="space-y-6">
          {filteredArticles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`text-center py-16 backdrop-blur-xl border rounded-2xl shadow-lg max-w-2xl mx-auto ${
                currentTheme === 'dark'
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/30 border-white/40'
              }`}
            >
              <FileText className={`w-20 h-20 mx-auto mb-6 ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <h2 className={`text-3xl font-bold mb-4 ${
                currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {searchTerm ? '未找到匹配的文章' : '暂无文章'}
              </h2>
              <p className={`mb-8 text-lg ${
                currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {searchTerm ? '尝试使用其他关键词搜索' : '目前还没有任何文章，请稍后再来查看'}
              </p>
              {user && !searchTerm && (
                <Button
                  asChild
                  size="lg"
                  className={`backdrop-blur-xl border transition-all duration-300 hover:scale-105 shadow-lg ${
                    currentTheme === 'dark'
                      ? 'bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-600/90 hover:to-purple-700/90 border-white/20 text-white shadow-blue-500/25'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-white/30 text-white shadow-blue-500/30'
                  }`}
                >
                  <Link href="/articles/new">成为第一个发表文章的人</Link>
                </Button>
              )}
              {searchTerm && (
                <Button 
                  onClick={() => setSearchTerm('')} 
                  variant="outline" 
                  size="lg"
                  className={`backdrop-blur-xl border transition-all duration-300 ${
                    currentTheme === 'dark'
                      ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                      : 'bg-white/30 border-white/40 text-gray-900 hover:bg-white/40'
                  }`}
                >
                  清除搜索
                </Button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence>
              {filteredArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="max-w-4xl mx-auto"
                >
                  <div 
                    className={`relative backdrop-blur-xl border rounded-2xl shadow-lg overflow-hidden transition-all duration-300 group hover:scale-[1.02] ${
                      currentTheme === 'dark'
                        ? 'border-white/20 hover:border-white/30'
                        : 'border-white/40 hover:border-white/50'
                    }`}
                    style={{
                      backgroundImage: article.cover_image?.url ? `url(${article.cover_image.url})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    {/* 背景遮罩层 */}
                    <div className={`absolute inset-0 backdrop-blur-sm ${
                      article.cover_image?.url 
                        ? 'bg-black/40' 
                        : currentTheme === 'dark'
                          ? 'bg-white/10'
                          : 'bg-white/30'
                    }`} />
                    
                    {/* 内容层 */}
                    <Card className="relative bg-transparent border-0 shadow-none">
                      <CardHeader className="pb-4">
                        <div className="space-y-4">
                          <Link href={`/articles/${article.id}`}>
                            <h2 className={`text-2xl font-bold transition-colors duration-300 group-hover:scale-[1.02] ${
                              article.cover_image?.url
                                ? 'text-white group-hover:text-blue-200 drop-shadow-lg'
                                : currentTheme === 'dark'
                                  ? 'text-white group-hover:text-blue-300'
                                  : 'text-gray-900 group-hover:text-blue-600'
                            }`}>
                              {article.title}
                            </h2>
                          </Link>

                          <div className={`flex items-center gap-6 text-sm ${
                            article.cover_image?.url
                              ? 'text-white/90 drop-shadow'
                              : currentTheme === 'dark' 
                                ? 'text-gray-400' 
                                : 'text-gray-600'
                          }`}>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span className="font-medium">{article.author.username || article.author.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDateTime(article.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 space-y-4">
                        {/* 使用组件渲染摘要内容 */}
                        <div className={`leading-relaxed text-base ${
                          article.cover_image?.url
                            ? 'text-white/90 drop-shadow'
                            : currentTheme === 'dark' 
                              ? 'text-gray-300' 
                              : 'text-gray-700'
                        }`}>
                          {article.contentType === 'markdown' ? (
                            <MarkdownRenderer 
                              content={getExcerpt(article.content, article.contentType)}
                              className={`excerpt-content ${
                                article.cover_image?.url
                                  ? 'prose-invert'
                                  : currentTheme === 'dark' 
                                    ? 'prose-invert' 
                                    : 'prose-gray'
                              }`}
                            />
                          ) : (
                            <HTMLRenderer 
                              content={getExcerpt(article.content, article.contentType)}
                              className={`excerpt-content ${
                                article.cover_image?.url
                                  ? 'prose-invert'
                                  : currentTheme === 'dark' 
                                    ? 'prose-invert' 
                                    : 'prose-gray'
                              }`}
                            />
                          )}
                        </div>

                        <div className="pt-2">
                          <Link
                            href={`/articles/${article.id}`}
                            className={`inline-flex items-center gap-2 font-semibold transition-all duration-300 hover:gap-3 ${
                              article.cover_image?.url
                                ? 'text-blue-200 hover:text-blue-100 drop-shadow'
                                : currentTheme === 'dark'
                                  ? 'text-blue-400 hover:text-blue-300'
                                  : 'text-blue-600 hover:text-blue-500'
                            }`}
                          >
                            阅读全文
                            <motion.span
                              animate={{ x: [0, 4, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              →
                            </motion.span>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* 分页导航 */}
        {articles.totalPages > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 flex flex-col items-center gap-6"
          >
            <div className="flex items-center gap-4">
              {articles.hasPrevPage && (
                <Link href={`/articles?page=${articles.prevPage}`}>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 transition-all duration-300 hover:scale-105 ${
                      currentTheme === 'dark'
                        ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                        : 'bg-white/40 border-white/30 text-gray-800 hover:bg-white/60 hover:border-white/40'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一页
                  </Button>
                </Link>
              )}
              
              <span className={`px-4 py-2 rounded-lg font-medium ${
                currentTheme === 'dark'
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/60 text-gray-800 border border-white/40'
              }`}>
                第 {articles.page} 页
              </span>
              
              {articles.hasNextPage && (
                <Link href={`/articles?page=${articles.nextPage}`}>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 transition-all duration-300 hover:scale-105 ${
                      currentTheme === 'dark'
                        ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                        : 'bg-white/40 border-white/30 text-gray-800 hover:bg-white/60 hover:border-white/40'
                    }`}
                  >
                    下一页
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
            
            <p className={`text-lg ${currentTheme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
              共 {articles.totalPages} 页 · 总计 {articles.totalDocs} 篇文章
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}