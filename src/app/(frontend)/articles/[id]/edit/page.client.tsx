'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import RichTextEditor from '@/components/RichTextEditor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from '@/providers/Theme'
import { useHeaderTheme } from '@/providers/HeaderTheme'

interface User {
  id: number
  username?: string
  email: string
}

interface Article {
  id: number
  title: string
  content: any
  status: 'draft' | 'published'
  cover_image?: {
    id: number
    url?: string
    alt?: string
  } | number | null
  author: {
    id: number
    username?: string
    email: string
  } | number
  createdAt: string
  updatedAt: string
}

interface ArticleEditClientProps {
  user: User
  article: Article
}

export const ArticleEditClient: React.FC<ArticleEditClientProps> = ({ user, article }) => {
  const router = useRouter()
  const { theme } = useTheme()
  const { setHeaderTheme } = useHeaderTheme()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: article.title,
    content: article.content, // 直接使用富文本内容
    status: article.status as 'draft' | 'published',
    cover_image: null as File | null,
  })
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    (typeof article.cover_image === 'object' && article.cover_image?.url) || null
  )
  const [shouldRemoveCover, setShouldRemoveCover] = useState(false)

  const isDark = theme === 'dark'

  useEffect(() => {
    setHeaderTheme(theme || 'light')
  }, [theme, setHeaderTheme])

  // 使用useMemo优化HTML转换，避免每次渲染都重新计算
  const htmlContent = useMemo(() => {
    return convertRichTextToHtml(formData.content)
  }, [formData.content])

  // 将富文本内容转换为HTML字符串用于RichTextEditor
  function convertRichTextToHtml(content: any): string {
    if (!content) return ''
    
    // 如果已经是字符串（HTML），直接返回
    if (typeof content === 'string') {
      return content
    }
    
    // 如果是富文本对象，转换为HTML
    if (content.root && content.root.children) {
      return convertNodesToHtml(content.root.children)
    }
    
    return ''
  }

  // 递归转换节点为HTML
  function convertNodesToHtml(nodes: any[]): string {
    return nodes.map(node => {
      if (node.type === 'paragraph') {
        const content = node.children ? convertNodesToHtml(node.children) : ''
        return `<p>${content}</p>`
      }
      if (node.type === 'text') {
        let text = node.text || ''
        // 处理文本格式
        if (node.format & 1) text = `<strong>${text}</strong>` // bold
        if (node.format & 2) text = `<em>${text}</em>` // italic
        if (node.format & 8) text = `<u>${text}</u>` // underline
        return text
      }
      if (node.type === 'heading') {
        const content = node.children ? convertNodesToHtml(node.children) : ''
        const tag = node.tag || 'h1'
        return `<${tag}>${content}</${tag}>`
      }
      if (node.type === 'list') {
        const content = node.children ? convertNodesToHtml(node.children) : ''
        const tag = node.listType === 'number' ? 'ol' : 'ul'
        return `<${tag}>${content}</${tag}>`
      }
      if (node.type === 'listitem') {
        const content = node.children ? convertNodesToHtml(node.children) : ''
        return `<li>${content}</li>`
      }
      if (node.type === 'image') {
        return `<img src="${node.src}" alt="${node.altText || ''}" />`
      }
      if (node.type === 'video') {
        return `<video src="${node.src}" controls></video>`
      }
      if (node.type === 'code') {
        const content = node.children ? convertNodesToHtml(node.children) : ''
        return `<pre><code class="language-${node.language || ''}">${content}</code></pre>`
      }
      // 默认处理其他节点
      if (node.children) {
        return convertNodesToHtml(node.children)
      }
      return ''
    }).join('')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, cover_image: file }))
      setShouldRemoveCover(false) // 重置删除状态
      const reader = new FileReader()
      reader.onload = () => {
        setCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, cover_image: null }))
    setCoverImagePreview(null)
    setShouldRemoveCover(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let coverImageId = typeof article.cover_image === 'object' ? article.cover_image?.id : article.cover_image

      // 如果有新的封面图片，先上传
      if (formData.cover_image) {
        const formDataForImage = new FormData()
        formDataForImage.append('file', formData.cover_image)

        const imageResponse = await fetch('/api/media', {
          method: 'POST',
          body: formDataForImage,
        })

        if (imageResponse.ok) {
          const imageResult = await imageResponse.json()
          coverImageId = imageResult.doc.id
        } else {
          throw new Error('图片上传失败')
        }
      }

      // 将富文本内容转换为HTML字符串保存
      let contentToSave = formData.content
      
      // 如果formData.content是HTML字符串，直接使用
      if (typeof formData.content === 'string') {
        contentToSave = formData.content
      } else {
        // 如果是富文本对象，转换为HTML字符串
        contentToSave = convertRichTextToHtml(formData.content)
      }

      // 更新文章
      const articleData = {
        title: formData.title,
        content: contentToSave, // 保存为HTML字符串
        contentType: 'richtext', // 明确标记为富文本类型
        status: formData.status,
        ...(shouldRemoveCover ? { cover_image: null } : coverImageId && { cover_image: coverImageId }),
      }

      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      })

      if (response.ok) {
        toast({
          title: '成功',
          description: '文章已更新',
        })
        router.push(`/articles/${article.id}`)
      } else {
        const error = await response.json()
        throw new Error(error.message || '更新失败')
      }
    } catch (error) {
      console.error('Error updating article:', error)
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '更新文章时出现错误',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className={`mb-6 backdrop-blur-xl border transition-all duration-300 hover:scale-105 ${
            isDark
              ? 'border-white/20 text-white hover:bg-white/10'
              : 'border-white/40 text-gray-700 hover:bg-white/20'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <Card className={`max-w-4xl mx-auto backdrop-blur-md border shadow-xl ${
          isDark
            ? 'bg-white/5 border-white/10'
            : 'bg-white/60 border-white/30'
        }`}>
          <CardHeader>
            <CardTitle className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              编辑文章
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 文章标题 */}
              <div className="space-y-2">
                <Label htmlFor="title" className={isDark ? 'text-white' : 'text-gray-700'}>
                  文章标题
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="请输入文章标题"
                  required
                  className={`backdrop-blur-xl border transition-all duration-300 ${
                    isDark
                      ? 'bg-white/10 border-white/20 text-white placeholder:text-gray-400'
                      : 'bg-white/50 border-white/40 text-gray-900 placeholder:text-gray-500'
                  }`}
                />
              </div>

              {/* 封面图片 */}
              <div className="space-y-2">
                <Label className={isDark ? 'text-white' : 'text-gray-700'}>
                  封面图片（可选）
                </Label>
                {coverImagePreview ? (
                  <div className="relative">
                    <img
                      src={coverImagePreview}
                      alt="封面预览"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeImage}
                      className="absolute top-2 right-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                    isDark
                      ? 'border-white/20 hover:border-white/30'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <Upload className={`w-12 h-12 mx-auto mb-4 ${
                      isDark ? 'text-white/60' : 'text-gray-400'
                    }`} />
                    <p className={`mb-4 ${
                      isDark ? 'text-white/80' : 'text-gray-600'
                    }`}>
                      点击选择图片或拖拽图片到此处
                    </p>
                    <Button type="button" variant="outline" asChild className={`${
                      isDark
                        ? 'border-white/20 text-white hover:bg-white/10'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}>
                      <label htmlFor="cover-image" className="cursor-pointer">
                        选择图片
                      </label>
                    </Button>
                    <input
                      id="cover-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* 文章内容 */}
              <div className="space-y-2">
                <Label htmlFor="content" className={isDark ? 'text-white' : 'text-gray-700'}>
                  文章内容
                </Label>
                <RichTextEditor
                  value={htmlContent}
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                  placeholder="开始编写文章内容..."
                  autoFocus
                />
              </div>

              {/* 发布状态 */}
              <div className="space-y-2">
                <Label className={isDark ? 'text-white' : 'text-gray-700'}>
                  发布状态
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'draft' | 'published') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className={`backdrop-blur-xl border transition-all duration-300 ${
                    isDark
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/50 border-white/40 text-gray-900'
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">发布</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                >
                  {isSubmitting ? '更新中...' : '更新文章'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className={`backdrop-blur-xl border transition-all duration-300 ${
                    isDark
                      ? 'border-white/20 text-white hover:bg-white/10'
                      : 'border-white/40 text-gray-700 hover:bg-white/20'
                  }`}
                >
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}