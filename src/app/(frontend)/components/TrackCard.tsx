'use client'

import React from 'react'
import Link from 'next/link'

interface TrackWithStats {
  id: string
  title: string
  description: string
  versionCount: number
  totalLikes: number
}

interface TrackCardProps {
  track: TrackWithStats
}

export const TrackCard: React.FC<TrackCardProps> = ({ track }) => {
  // 简化描述文本，只显示纯文本
  const getDescriptionText = (description: any) => {
    if (!description) return ''
    
    // 如果description是数组格式（Lexical富文本）
    if (Array.isArray(description)) {
      // 简单处理，提取文本内容
      const text = description.map((node: any) => {
        if (node.type === 'text') {
          return node.text
        } else if (node.children) {
          return node.children.map((child: any) => child.text || '').join('')
        }
        return ''
      }).join(' ')
      
      return text.substring(0, 100) + (text.length > 100 ? '...' : '')
    }
    
    // 如果是字符串格式
    if (typeof description === 'string') {
      return description.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
    }
    
    return ''
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-2 text-gray-800">
          <Link href={`/tracks/${track.id}`} className="hover:text-blue-600 transition-colors">
            {track.title}
          </Link>
        </h2>
        
        <p className="text-gray-600 mb-4 text-sm">
          {getDescriptionText(track.description)}
        </p>
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-4 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {track.versionCount} 个版本
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {track.totalLikes} 个喜欢
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}