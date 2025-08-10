'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Upload, Check, X, Camera, Palette } from 'lucide-react'
import { useAuth } from '@/providers/Auth'
import { useTheme } from '@/providers/Theme'
import { DefaultAvatar } from '@/components/DefaultAvatar'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import type { User as UserType, Media } from '@/payload-types'
import { useRouter } from 'next/navigation'

interface AvatarConfigClientProps {
  user: UserType
}

const defaultAvatarOptions = [
  { label: '音符', value: 'music-note' },
  { label: '麦克风', value: 'microphone' },
  { label: '钢琴', value: 'piano' },
  { label: '小提琴', value: 'violin' },
  { label: '吉他', value: 'guitar' },
  { label: '鼓', value: 'drums' },
  { label: '萨克斯', value: 'saxophone' },
  { label: '小号', value: 'trumpet' },
  { label: '长笛', value: 'flute' },
  { label: '大提琴', value: 'cello' },
] as const

type DefaultAvatarType = (typeof defaultAvatarOptions)[number]['value']

export const AvatarConfigClient: React.FC<AvatarConfigClientProps> = ({ user }) => {
  const [selectedDefaultAvatar, setSelectedDefaultAvatar] = useState<DefaultAvatarType>(
    (user.default_avatar as DefaultAvatarType) || 'music-note',
  )
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const { theme } = useTheme()
  const { user: authUser, setUser } = useAuth()
  const router = useRouter()
  const currentTheme = theme || 'light'

  const currentAvatarUrl =
    user.avatar && typeof user.avatar === 'object' ? getMediaUrl((user.avatar as Media).url) : null

  useEffect(() => {
    setMounted(true)
  }, [])

  const validateFile = (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml']

    if (file.size > maxSize) {
      alert('文件大小不能超过 5MB')
      return false
    }

    if (!allowedTypes.includes(file.type)) {
      alert('只支持 JPG、PNG 和 SVG 格式的图片')
      return false
    }

    return true
  }

  const processFile = (file: File) => {
    console.log('Processing file:', file.name, file.type, file.size)
    if (validateFile(file)) {
      console.log('File validation passed, setting preview')
      setUploadedFile(file)
      const url = URL.createObjectURL(file)
      console.log('Created object URL:', url)
      setPreviewUrl(url)
      console.log('Preview URL state set to:', url)
      console.log('uploadedFile state set to:', file)
    } else {
      console.log('File validation failed')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File select event triggered')
    const file = event.target.files?.[0]
    if (file) {
      console.log('File selected:', file.name)
      processFile(file)
    } else {
      console.log('No file selected')
    }
    // 重置 input 的 value，确保同一文件可以重复选择
    event.target.value = ''
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('File drop event triggered')

    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      console.log('File dropped:', file.name)
      processFile(file)
    } else {
      console.log('No files dropped')
    }
  }

  const handleUploadAreaClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('Upload area clicked')
    if (fileInputRef.current) {
      console.log('Triggering file input click')
      // 确保文件输入元素可见并可交互
      fileInputRef.current.style.display = 'block'
      fileInputRef.current.style.position = 'absolute'
      fileInputRef.current.style.left = '-9999px'
      fileInputRef.current.click()
      // 恢复隐藏状态
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.style.display = 'none'
        }
      }, 100)
    } else {
      console.log('File input ref is null')
    }
  }

  const handleUploadAvatar = async () => {
    if (!uploadedFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const uploadResponse = await fetch('/api/media', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!uploadResponse.ok) {
        throw new Error('上传失败')
      }

      const uploadedMedia = await uploadResponse.json()

      const updateResponse = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          avatar: uploadedMedia.doc.id,
          default_avatar: null,
        }),
      })

      if (!updateResponse.ok) {
        throw new Error('更新用户头像失败')
      }

      const updatedUser = await updateResponse.json()
      setUser(updatedUser.doc)

      // 清理上传状态
      clearUpload()

      alert('头像上传成功！')
      router.refresh()
    } catch (error) {
      console.error('上传头像失败:', error)
      alert('上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveDefaultAvatar = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          default_avatar: selectedDefaultAvatar,
          avatar: null,
        }),
      })

      if (!response.ok) {
        throw new Error('保存失败')
      }

      const updatedUser = await response.json()
      setUser(updatedUser.doc)

      alert('默认头像保存成功！')
      router.refresh()
    } catch (error) {
      console.error('保存默认头像失败:', error)
      alert('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const clearUpload = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setUploadedFile(null)
    setPreviewUrl(null)
  }

  if (!mounted) {
    return <div>加载中...</div>
  }

  return (
    <div className="min-h-screen relative">
      {/* 背景层 */}
      <div className="fixed inset-0 -z-10">
        <div
          className={`absolute inset-0 transition-all duration-1000 ${
            currentTheme === 'dark'
              ? 'bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20'
              : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
          }`}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                头像设置
              </CardTitle>
              <p
                className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
              >
                上传自定义头像或选择默认头像
              </p>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* 当前头像预览 */}
              <div className="text-center">
                <h3
                  className={`text-xl font-semibold mb-4 ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  当前头像
                </h3>
                <div className="flex justify-center">
                  {currentAvatarUrl ? (
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={currentAvatarUrl} alt="当前头像" />
                      <AvatarFallback>
                        <DefaultAvatar type={selectedDefaultAvatar} size="xl" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                      <DefaultAvatar type={selectedDefaultAvatar} size="xl" />
                    </div>
                  )}
                </div>
              </div>

              {/* 上传自定义头像区域 */}
              <div className="space-y-4">
                <h3
                  className={`text-lg font-semibold ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  上传自定义头像
                </h3>

                {!previewUrl ? (
                  <div
                    onClick={handleUploadAreaClick}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      currentTheme === 'dark'
                        ? 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                        : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    }`}
                  >
                    <Upload
                      className={`mx-auto h-12 w-12 mb-4 ${
                        currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    />
                    <p
                      className={`text-lg font-medium mb-2 ${
                        currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      点击上传或拖拽文件到此处
                    </p>
                    <p
                      className={`text-sm ${
                        currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      支持 JPG、PNG、SVG 格式，文件大小不超过 5MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Avatar className="w-32 h-32">
                        <AvatarImage src={previewUrl || ''} alt="预览头像" />
                        <AvatarFallback>预览</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={clearUpload} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        清除
                      </Button>
                      <Button onClick={handleUploadAvatar} disabled={isUploading} size="sm">
                        {isUploading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            上传中...
                          </div>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            上传头像
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/svg+xml"
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple={false}
                />
              </div>

              {/* 默认头像选择区域 */}
              <div className="space-y-4">
                <h3
                  className={`text-lg font-semibold ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  选择默认头像
                </h3>

                <div className="grid grid-cols-5 gap-4">
                  {defaultAvatarOptions.map((option) => (
                    <motion.div
                      key={option.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative cursor-pointer rounded-lg p-3 border-2 transition-all ${
                        selectedDefaultAvatar === option.value
                          ? currentTheme === 'dark'
                            ? 'border-blue-400 bg-blue-900/20'
                            : 'border-blue-500 bg-blue-50'
                          : currentTheme === 'dark'
                            ? 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => setSelectedDefaultAvatar(option.value)}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <DefaultAvatar type={option.value} size="lg" />
                        <span
                          className={`text-xs font-medium ${
                            currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </span>
                      </div>
                      {selectedDefaultAvatar === option.value && (
                        <div className="absolute -top-1 -right-1">
                          <Badge
                            variant="default"
                            className="h-5 w-5 rounded-full p-0 flex items-center justify-center"
                          >
                            <Check className="h-3 w-3" />
                          </Badge>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={handleSaveDefaultAvatar}
                    disabled={isSaving}
                    className="min-w-32"
                  >
                    {isSaving ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        保存中...
                      </div>
                    ) : (
                      <>
                        <Palette className="h-4 w-4 mr-2" />
                        保存默认头像
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default AvatarConfigClient
