'use client'

import React, { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { cn } from '@/utilities/ui'
import { useTheme } from '@/providers/Theme'

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
  onClose: () => void
}

export default function ImageUpload({ onImageUpload, onClose }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const handleFileSelect = async (file: File) => {
    // 重置错误状态
    setError(null)
    setUploadProgress(0)

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件（支持 JPG、PNG、GIF、WebP、SVG 格式）')
      return
    }

    // 验证文件大小（限制为10MB）
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('图片文件大小不能超过 10MB')
      return
    }

    setUploading(true)
    setUploadProgress(10)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', file.name)

      setUploadProgress(30)

      const response = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      setUploadProgress(70)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '服务器响应错误' }))
        throw new Error(errorData.message || `上传失败 (${response.status})`)
      }

      const data = await response.json()
      setUploadProgress(90)

      // 验证返回的数据
      if (!data.doc) {
        throw new Error('服务器返回数据格式错误')
      }

      // 构建图片URL - 使用API返回的URL
      const imageUrl = data.doc.url || `/api/media/file/${encodeURIComponent(data.doc.filename)}`
      
      // 验证图片URL是否有效
      await new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = resolve
        img.onerror = () => reject(new Error('图片URL无效或无法访问'))
        img.src = imageUrl
      })

      setUploadProgress(100)
      onImageUpload(imageUrl)
      onClose()
    } catch (error) {
      console.error('上传错误:', error)
      const errorMessage = error instanceof Error ? error.message : '图片上传失败，请重试'
      setError(errorMessage)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={cn(
          'bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-auto',
          isDark && 'bg-gray-800'
        )}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className={cn('text-lg font-semibold', isDark && 'text-white')}>
            上传图片
          </h3>
          <button
            onClick={onClose}
            className={cn(
              'p-1 rounded hover:bg-gray-100',
              isDark && 'hover:bg-gray-700 text-white'
            )}
          >
            <X size={20} />
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className={cn(
            'mb-4 p-3 rounded-lg border',
            'border-red-200 bg-red-50 text-red-700',
            isDark && 'border-red-800 bg-red-900/20 text-red-400'
          )}>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-colors touch-manipulation',
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 active:border-blue-400',
            isDark && {
              'border-gray-600 hover:border-gray-500 active:border-blue-400': !dragOver,
              'border-blue-400 bg-blue-900/20': dragOver,
            },
            uploading && 'pointer-events-none opacity-50',
            error && 'border-red-300'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <Upload
            className={cn(
              'mx-auto mb-4 text-gray-400 w-9 h-9 sm:w-12 sm:h-12',
              isDark && 'text-gray-500'
            )}
          />
          
          <p className={cn('text-gray-600 mb-2 text-sm sm:text-base', isDark && 'text-gray-300')}>
            {uploading ? '上传中...' : '点击或拖拽图片到此处'}
          </p>
          
          {uploading && uploadProgress > 0 && (
            <div className="mb-4">
              <div className={cn(
                'w-full bg-gray-200 rounded-full h-2',
                isDark && 'bg-gray-700'
              )}>
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className={cn('text-xs mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
                {uploadProgress}%
              </p>
            </div>
          )}
          
          <p className={cn('text-xs sm:text-sm text-gray-500', isDark && 'text-gray-400')}>
            支持 JPG、PNG、GIF、WebP、SVG 格式，最大 10MB
          </p>
        </div>
      </div>
    </div>
  )
}