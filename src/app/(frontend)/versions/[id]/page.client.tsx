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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Link from 'next/link'
import {
  ArrowLeft,
  Music,
  Heart,
  Download,
  Calendar,
  User,
  Tag,
  FileText,
  Eye,
  Upload,
  Plus,
  Loader2,
} from 'lucide-react'
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
  title: string
  description?: string
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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 预览相关状态
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [previewScore, setPreviewScore] = useState<Score | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

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
    // 检查name字段是否存在且不为空字符串
    if (creator.name && creator.name.trim() !== '') {
      return creator.name
    }
    return creator.email || '匿名用户'
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

  // 预览乐谱
  const handlePreviewScore = async (score: Score) => {
    setPreviewScore(score)
    setShowPreviewDialog(true)
    setPreviewLoading(true)

    // 预加载PDF以确保能正常显示
    try {
      const response = await fetch(score.url)
      if (response.ok) {
        setPreviewLoading(false)
      }
    } catch (error) {
      console.error('预览加载失败:', error)
      setPreviewLoading(false)
    }
  }

  // 下载乐谱
  const handleDownloadScore = async (score: Score) => {
    try {
      // 获取当前用户信息
      const userResponse = await fetch('/api/users/me', {
        credentials: 'include',
      })

      let username = '用户'
      if (userResponse.ok) {
        const userData = await userResponse.json()
        username = userData.user?.name || userData.user?.email || '用户'
      }

      // 构建文件名：【曲目】版本-乐谱标题.pdf
      const trackName = typeof version.track === 'string' ? '曲目' : version.track.title
      const versionName = version.title
      const scoreTitle = score.title || score.filename.replace(/\.[^/.]+$/, '') // 使用乐谱标题，如果没有则使用文件名（去掉扩展名）
      const fileName = `【${trackName}】${versionName}-${scoreTitle}.pdf`

      // 下载文件
      const response = await fetch(score.url)
      if (!response.ok) {
        throw new Error('下载失败')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('下载失败:', error)
      alert('下载失败，请稍后重试')
    }
  }

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 验证文件类型
      if (file.type !== 'application/pdf') {
        alert('只支持 PDF 格式的文件')
        return
      }
      // 验证文件大小 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('文件大小不能超过 10MB')
        return
      }
      setUploadFile(file)
    }
    // 重置 input 的 value
    event.target.value = ''
  }

  // 处理乐谱上传
  const handleUploadScore = async () => {
    if (!uploadFile) {
      alert('请选择文件')
      return
    }

    if (!uploadTitle.trim()) {
      alert('请输入乐谱标题')
      return
    }

    setIsUploading(true)
    try {
      // 直接上传到 /api/scores，因为 Scores 是一个 upload 集合
      const formData = new FormData()
      formData.append('file', uploadFile)

      const title = uploadTitle.trim()
      const description = uploadDescription.trim() || title
      formData.append('title', title)
      formData.append('description', description)
      formData.append('track_version', version.id)
      formData.append('alt', title)

      const scoreResponse = await fetch('/api/scores', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!scoreResponse.ok) {
        const errorData = await scoreResponse.json()
        throw new Error(errorData.message || '乐谱上传失败')
      }

      const newScore = await scoreResponse.json()

      // 更新本地状态
      setScores((prev) => [
        ...prev,
        {
          ...newScore.doc,
          id: String(newScore.doc.id),
        },
      ])

      // 重置上传状态
      setUploadFile(null)
      setUploadTitle('')
      setUploadDescription('')
      setShowUploadDialog(false)

      alert('乐谱上传成功！')
    } catch (error) {
      console.error('上传乐谱失败:', error)
      alert(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsUploading(false)
    }
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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">乐谱文件</h2>
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0 rounded-xl py-2 px-4 font-medium transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  上传乐谱
                </Button>
              </div>
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
                            {score.title || score.filename || '乐谱文件'}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          {/* 文件信息 */}
                          <div className="space-y-2 text-sm text-muted-foreground">
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
                            <Button
                              onClick={() => handlePreviewScore(score)}
                              className="flex-1 bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-700 hover:to-blue-800 text-white border-0 rounded-xl py-2 font-medium transition-all duration-300"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              预览
                            </Button>
                            <Button
                              onClick={() => handleDownloadScore(score)}
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

      {/* 乐谱上传对话框 */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传乐谱</DialogTitle>
            <DialogDescription>为此版本上传 PDF 格式的乐谱文件</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="score-file">选择文件</Label>
              <Input
                id="score-file"
                type="file"
                accept=".pdf"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="mt-1"
              />
              {uploadFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  已选择: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="score-title">标题 *</Label>
              <Input
                id="score-title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="输入乐谱标题，如：第一章、完整版等"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="score-description">详细描述 (可选)</Label>
              <Input
                id="score-description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="为这个乐谱添加详细描述..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false)
                setUploadFile(null)
                setUploadTitle('')
                setUploadDescription('')
              }}
            >
              取消
            </Button>
            <Button onClick={handleUploadScore} disabled={!uploadFile || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  上传
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 乐谱预览对话框 */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-semibold">
              预览乐谱: {previewScore?.filename || '乐谱文件'}
            </DialogTitle>
            {previewScore?.description && (
              <DialogDescription className="text-sm text-muted-foreground">
                {previewScore.description}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="px-6 pb-6">
            {previewLoading ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">加载中...</span>
              </div>
            ) : previewScore ? (
              <div className="w-full h-96 border rounded-lg overflow-hidden bg-gray-50 relative">
                <embed
                  src={`${previewScore.url}#page=1&view=FitV&toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&zoom=page-height&pagemode=none`}
                  type="application/pdf"
                  className="w-full h-full"
                  title="PDF预览 - 仅第一页"
                  style={{
                    border: 'none',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  className="absolute inset-0 bg-transparent"
                  style={{ pointerEvents: 'none' }}
                />
              </div>
            ) : null}

            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                文件大小: {previewScore ? formatFileSize(previewScore.filesize) : ''} | 上传时间:{' '}
                {previewScore ? formatDate(previewScore.createdAt) : ''}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => previewScore && handleDownloadScore(previewScore)}
                  className="bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载
                </Button>
                <Button onClick={() => setShowPreviewDialog(false)} variant="outline">
                  关闭
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
