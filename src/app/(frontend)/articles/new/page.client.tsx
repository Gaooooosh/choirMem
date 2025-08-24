'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import RichTextEditor from '@/components/RichTextEditor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { useTheme } from '@/providers/Theme'
import { useHeaderTheme } from '@/providers/HeaderTheme'

interface User {
  id: number
  username?: string
  email: string
}

interface ArticleEditorClientProps {
  user: User
}

export const ArticleEditorClient: React.FC<ArticleEditorClientProps> = ({ user }) => {
  const router = useRouter()
  const { theme } = useTheme()
  const { setHeaderTheme } = useHeaderTheme()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'draft' as 'draft' | 'published',
    cover_image: null as File | null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast({
        title: '错误',
        description: '请输入文章标题',
        variant: 'destructive',
      })
      return
    }

    if (!formData.content.trim()) {
      toast({
        title: '错误',
        description: '请输入文章内容',
        variant: 'destructive',
      })
      return
    }

    if (!user || !user.id) {
      toast({
        title: '错误',
        description: '用户信息无效，请重新登录',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 首先上传封面图片（如果有）
      let coverImageId = null
      if (formData.cover_image) {
        const imageFormData = new FormData()
        imageFormData.append('file', formData.cover_image)
        imageFormData.append('uploader', user.id.toString())

        const imageResponse = await fetch('/api/media', {
          method: 'POST',
          body: imageFormData,
        })

        if (imageResponse.ok) {
          const imageData = await imageResponse.json()
          coverImageId = imageData.doc.id
        } else {
          const error = await imageResponse.json()
          throw new Error(error.message || '上传封面图片失败')
        }
      }

      // 创建富文本内容结构
      const richTextContent = {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'text',
                  format: 0,
                  style: '',
                  mode: 'normal',
                  text: formData.content,
                  version: 1,
                },
              ],
              direction: 'ltr',
            },
          ],
          direction: 'ltr',
        },
      }

      // 创建文章
      console.log('User object:', user)
      console.log('User ID:', user.id)
      const articleData = {
        title: formData.title,
        content: richTextContent,
        status: formData.status,
        author: user.id,
        ...(coverImageId && { cover_image: coverImageId }),
      }
      console.log('Article data before sending:', articleData)

      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: '成功',
          description: formData.status === 'published' ? '文章已发布' : '文章已保存为草稿',
        })
        router.push(`/articles/${result.doc.id}`)
      } else {
        const error = await response.json()
        throw new Error(error.message || '创建文章失败')
      }
    } catch (error) {
      console.error('Error creating article:', error)
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '创建文章失败',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: '错误',
          description: '图片大小不能超过 5MB',
          variant: 'destructive',
        })
        return
      }
      setFormData((prev) => ({ ...prev, cover_image: file }))
    }
  }

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, cover_image: null }))
  }



  useEffect(() => {
    setHeaderTheme(theme || 'light')
  }, [theme, setHeaderTheme])

  const isDark = theme === 'dark'
  const currentTheme = theme || 'dark'

  return (
    <div className={`min-h-screen pt-20 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
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

        {/* 编辑器 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className={isDark ? "bg-white/5 border-white/10 backdrop-blur-sm" : "bg-white/80 border-white/40 backdrop-blur-sm"}>
            <CardHeader>
              <CardTitle className={`text-2xl ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>发表新文章</CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 文章标题 */}
                <div className="space-y-2">
                  <Label htmlFor="title" className={isDark ? "text-white" : "text-gray-700"}>
                    文章标题
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="输入文章标题..."
                    className={isDark ? "bg-white/10 border-white/20 text-white placeholder:text-white/50" : "bg-white/50 border-gray-300 text-gray-900 placeholder:text-gray-500"}
                    required
                  />
                </div>

                {/* 封面图片 */}
                <div className="space-y-2">
                  <Label className={isDark ? "text-white" : "text-gray-700"}>封面图片（可选）</Label>
                  {formData.cover_image ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(formData.cover_image)}
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
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      isDark ? 'border-white/20' : 'border-gray-300'
                    }`}>
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${
                        isDark ? 'text-white/50' : 'text-gray-400'
                      }`} />
                      <p className={isDark ? "text-white/70 mb-2" : "text-gray-600 mb-2"}>点击上传封面图片</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="cover-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        asChild
                        className={isDark ? "border-white/20 text-white hover:bg-white/10" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
                      >
                        <label htmlFor="cover-upload" className="cursor-pointer">
                          选择图片
                        </label>
                      </Button>
                    </div>
                  )}
                </div>

                {/* 文章内容 */}
                <div className="space-y-2">
                  <Label htmlFor="content" className={isDark ? "text-white" : "text-gray-700"}>
                    文章内容
                  </Label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
                    placeholder="在这里写下你的文章内容..."
                    autoFocus
                  />
                </div>



                {/* 发布状态 */}
                <div className="space-y-2">
                  <Label className={isDark ? "text-white" : "text-gray-700"}>发布状态</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'published') =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className={isDark ? "bg-white/10 border-white/20 text-white" : "bg-white/50 border-gray-300 text-gray-900"}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">保存为草稿</SelectItem>
                      <SelectItem value="published">立即发布</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 提交按钮 */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {isSubmitting ? (
                      '提交中...'
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {formData.status === 'published' ? '发布文章' : '保存草稿'}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className={isDark ? "border-white/20 text-white hover:bg-white/10" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
                  >
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}