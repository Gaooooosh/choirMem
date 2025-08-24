'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '@/providers/Theme'
import { cn } from '@/utilities/ui'
import ImageUpload from '@/components/RichTextEditor/ImageUpload'
import { Smartphone, Monitor, Tablet } from 'lucide-react'

interface DeviceInfo {
  width: number
  height: number
  devicePixelRatio: number
  touchSupport: boolean
}

export default function TestMobileUploadPage() {
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [viewportSize, setViewportSize] = useState<'mobile' | 'tablet' | 'desktop'>('mobile')
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    // 只在客户端获取设备信息
    const updateDeviceInfo = () => {
      setDeviceInfo({
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        touchSupport: 'ontouchstart' in window
      })
    }

    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
    }
  }, [])

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImages(prev => [...prev, imageUrl])
    setShowImageUpload(false)
  }

  const handleImageUploadClose = () => {
    setShowImageUpload(false)
  }

  const getViewportClass = () => {
    switch (viewportSize) {
      case 'mobile':
        return 'max-w-sm mx-auto'
      case 'tablet':
        return 'max-w-2xl mx-auto'
      case 'desktop':
        return 'max-w-6xl mx-auto'
      default:
        return 'max-w-sm mx-auto'
    }
  }

  return (
    <div className={cn(
      'min-h-screen p-4',
      isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    )}>
      <div className={getViewportClass()}>
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className={cn(
            'text-2xl sm:text-3xl font-bold mb-4',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            移动端图片上传测试
          </h1>
          <p className={cn(
            'text-sm sm:text-base',
            isDark ? 'text-gray-300' : 'text-gray-600'
          )}>
            测试不同设备尺寸下的图片上传体验
          </p>
        </div>

        {/* 视口大小切换器 */}
        <div className="flex justify-center mb-8">
          <div className={cn(
            'flex rounded-lg p-1',
            isDark ? 'bg-gray-800' : 'bg-white border'
          )}>
            <button
              onClick={() => setViewportSize('mobile')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                viewportSize === 'mobile'
                  ? 'bg-blue-500 text-white'
                  : isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <Smartphone size={16} />
              手机
            </button>
            <button
              onClick={() => setViewportSize('tablet')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                viewportSize === 'tablet'
                  ? 'bg-blue-500 text-white'
                  : isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <Tablet size={16} />
              平板
            </button>
            <button
              onClick={() => setViewportSize('desktop')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                viewportSize === 'desktop'
                  ? 'bg-blue-500 text-white'
                  : isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <Monitor size={16} />
              桌面
            </button>
          </div>
        </div>

        {/* 上传按钮 */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowImageUpload(true)}
            className={cn(
              'px-6 py-3 rounded-lg font-medium transition-colors touch-manipulation',
              'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              isDark && 'focus:ring-offset-gray-900'
            )}
          >
            上传图片
          </button>
        </div>

        {/* 设备信息显示 */}
        <div className={cn(
          'mb-8 p-4 rounded-lg',
          isDark ? 'bg-gray-800' : 'bg-white border'
        )}>
          <h3 className={cn(
            'text-lg font-semibold mb-3',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            当前设备信息
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className={cn(
                'font-medium',
                isDark ? 'text-gray-300' : 'text-gray-600'
              )}>
                视口宽度:
              </span>
              <span className={cn(
                'ml-2',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                {deviceInfo ? `${deviceInfo.width}px` : '加载中...'}
              </span>
            </div>
            <div>
              <span className={cn(
                'font-medium',
                isDark ? 'text-gray-300' : 'text-gray-600'
              )}>
                视口高度:
              </span>
              <span className={cn(
                'ml-2',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                {deviceInfo ? `${deviceInfo.height}px` : '加载中...'}
              </span>
            </div>
            <div>
              <span className={cn(
                'font-medium',
                isDark ? 'text-gray-300' : 'text-gray-600'
              )}>
                设备像素比:
              </span>
              <span className={cn(
                'ml-2',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                {deviceInfo ? deviceInfo.devicePixelRatio : '加载中...'}
              </span>
            </div>
            <div>
              <span className={cn(
                'font-medium',
                isDark ? 'text-gray-300' : 'text-gray-600'
              )}>
                触摸支持:
              </span>
              <span className={cn(
                'ml-2',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                {deviceInfo ? (deviceInfo.touchSupport ? '是' : '否') : '加载中...'}
              </span>
            </div>
          </div>
        </div>

        {/* 已上传的图片 */}
        {uploadedImages.length > 0 && (
          <div className={cn(
            'mb-8 p-4 rounded-lg',
            isDark ? 'bg-gray-800' : 'bg-white border'
          )}>
            <h3 className={cn(
              'text-lg font-semibold mb-4',
              isDark ? 'text-white' : 'text-gray-900'
            )}>
              已上传的图片 ({uploadedImages.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className={cn(
                    'rounded-lg overflow-hidden',
                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                  )}
                >
                  <img
                    src={imageUrl}
                    alt={`上传的图片 ${index + 1}`}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  <div className="p-3">
                    <p className={cn(
                      'text-xs truncate',
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    )}>
                      {imageUrl}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 测试指南 */}
        <div className={cn(
          'p-4 rounded-lg',
          isDark ? 'bg-gray-800' : 'bg-white border'
        )}>
          <h3 className={cn(
            'text-lg font-semibold mb-4',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            测试指南
          </h3>
          <ul className={cn(
            'space-y-2 text-sm',
            isDark ? 'text-gray-300' : 'text-gray-600'
          )}>
            <li>• 切换不同的视口大小模拟不同设备</li>
            <li>• 测试点击上传按钮的响应性</li>
            <li>• 测试拖拽上传功能（桌面端）</li>
            <li>• 测试触摸交互（移动端）</li>
            <li>• 验证上传进度条显示</li>
            <li>• 检查错误提示的可读性</li>
            <li>• 确保模态框在小屏幕上正确显示</li>
          </ul>
        </div>
      </div>

      {/* 图片上传组件 */}
      {showImageUpload && (
        <ImageUpload
          onImageUpload={handleImageUpload}
          onClose={handleImageUploadClose}
        />
      )}
    </div>
  )
}