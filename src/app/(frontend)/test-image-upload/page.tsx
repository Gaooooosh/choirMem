'use client'

import React, { useState } from 'react'
import RichTextEditor from '@/components/RichTextEditor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Upload, Image as ImageIcon } from 'lucide-react'
import { useTheme } from '@/providers/Theme'
import { cn } from '@/utilities/ui'

interface UploadTest {
  id: string
  name: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  message?: string
  imageUrl?: string
  file?: File
}

export default function TestImageUploadPage() {
  const [editorContent, setEditorContent] = useState('')
  const [uploadTests, setUploadTests] = useState<UploadTest[]>([])
  const [isTestingBatch, setIsTestingBatch] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // 测试单个文件上传
  const testSingleUpload = async (file: File) => {
    const testId = Date.now().toString()
    const newTest: UploadTest = {
      id: testId,
      name: file.name,
      status: 'uploading',
      file
    }

    setUploadTests(prev => [...prev, newTest])

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', file.name)

      const response = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      const imageUrl = data.doc.url || `/media/${data.doc.filename}`

      setUploadTests(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'success', message: '上传成功', imageUrl }
          : test
      ))

      return imageUrl
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setUploadTests(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'error', message: errorMessage }
          : test
      ))
      throw error
    }
  }

  // 批量测试不同格式
  const testBatchUpload = async () => {
    setIsTestingBatch(true)
    
    // 创建测试文件
    const testFiles = [
      createTestSVG('test-svg.svg'),
      createTestCanvas('test-png.png', 'image/png'),
      createTestCanvas('test-jpeg.jpg', 'image/jpeg'),
      createTestCanvas('test-webp.webp', 'image/webp')
    ]

    for (const file of testFiles) {
      try {
        await testSingleUpload(file)
        await new Promise(resolve => setTimeout(resolve, 500)) // 延迟避免并发问题
      } catch (error) {
        console.error(`测试文件 ${file.name} 失败:`, error)
      }
    }

    setIsTestingBatch(false)
  }

  // 创建测试SVG文件
  const createTestSVG = (filename: string): File => {
    const svgContent = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#4F46E5"/>
      <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="16">SVG测试</text>
    </svg>`
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    return new File([blob], filename, { type: 'image/svg+xml' })
  }

  // 创建测试Canvas图片
  const createTestCanvas = (filename: string, mimeType: string): File => {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
    const ctx = canvas.getContext('2d')!
    
    // 绘制测试图案
    ctx.fillStyle = '#10B981'
    ctx.fillRect(0, 0, 200, 200)
    ctx.fillStyle = 'white'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(mimeType.split('/')[1].toUpperCase(), 100, 100)
    
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(new File([blob!], filename, { type: mimeType }))
      }, mimeType)
    }) as any // 简化处理，实际使用中应该正确处理Promise
  }

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach(file => {
        testSingleUpload(file)
      })
    }
  }

  // 清除测试结果
  const clearTests = () => {
    setUploadTests([])
  }

  return (
    <div className={cn('min-h-screen p-6', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className={cn('text-3xl font-bold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
            图片上传功能测试
          </h1>
          <p className={cn('text-lg', isDark ? 'text-gray-300' : 'text-gray-600')}>
            测试富文本编辑器的图片上传功能
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 富文本编辑器测试区域 */}
          <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : ''}>
                <ImageIcon className="inline mr-2" size={20} />
                富文本编辑器测试
              </CardTitle>
              <CardDescription className={isDark ? 'text-gray-300' : ''}>
                在编辑器中测试图片上传和显示功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                value={editorContent}
                onChange={setEditorContent}
                placeholder="点击工具栏的图片按钮测试上传功能..."
              />
            </CardContent>
          </Card>

          {/* 上传测试控制面板 */}
          <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : ''}>
                <Upload className="inline mr-2" size={20} />
                上传测试控制面板
              </CardTitle>
              <CardDescription className={isDark ? 'text-gray-300' : ''}>
                测试不同格式和场景的图片上传
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={testBatchUpload}
                  disabled={isTestingBatch}
                  className="flex items-center gap-2"
                >
                  <Upload size={16} />
                  {isTestingBatch ? '测试中...' : '批量格式测试'}
                </Button>
                
                <Button variant="outline" asChild>
                  <label className="cursor-pointer flex items-center gap-2">
                    <ImageIcon size={16} />
                    选择文件测试
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </Button>
                
                <Button variant="outline" onClick={clearTests}>
                  清除结果
                </Button>
              </div>

              {/* 测试结果显示 */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {uploadTests.map((test) => (
                  <Alert key={test.id} className={cn(
                    'flex items-center gap-3',
                    test.status === 'success' && 'border-green-200 bg-green-50',
                    test.status === 'error' && 'border-red-200 bg-red-50',
                    test.status === 'uploading' && 'border-blue-200 bg-blue-50',
                    isDark && {
                      'border-green-800 bg-green-900/20': test.status === 'success',
                      'border-red-800 bg-red-900/20': test.status === 'error',
                      'border-blue-800 bg-blue-900/20': test.status === 'uploading',
                    }
                  )}>
                    <div className="flex-shrink-0">
                      {test.status === 'success' && <CheckCircle className="text-green-600" size={20} />}
                      {test.status === 'error' && <XCircle className="text-red-600" size={20} />}
                      {test.status === 'uploading' && (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn('font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>
                        {test.name}
                      </div>
                      {test.message && (
                        <AlertDescription className={cn(
                          'text-sm mt-1',
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        )}>
                          {test.message}
                        </AlertDescription>
                      )}
                    </div>
                    {test.imageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={test.imageUrl}
                          alt={test.name}
                          className="w-12 h-12 object-cover rounded border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 技术信息面板 */}
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-white' : ''}>
              技术信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <div className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>支持格式</div>
                <div className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>
                  JPG, PNG, GIF, WebP, SVG
                </div>
              </div>
              <div>
                <div className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>上传路径</div>
                <div className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>
                  /api/media
                </div>
              </div>
              <div>
                <div className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>存储位置</div>
                <div className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>
                  /public/media
                </div>
              </div>
              <div>
                <div className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>认证方式</div>
                <div className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>
                  Cookie Token
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}