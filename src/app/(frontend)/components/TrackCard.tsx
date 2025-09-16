'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Music,
  Heart,
  Eye,
  Calendar,
  User,
  Play,
  Download,
  Share2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Track {
  id: string
  title: string
  description?: any
  slug?: string
  createdAt: string
  updatedAt?: string
  author?: {
    id: string
    name?: string
    email: string
    avatar?: string
  }
  tags?: Array<{
    id: string
    name: string
    color?: string
  }>
  stats?: {
    versionCount: number
    totalLikes: number
    viewCount: number
  }
  category?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  duration?: number
}

interface TrackCardProps {
  track: Track
  variant?: 'default' | 'compact' | 'detailed'
  showActions?: boolean
  showStats?: boolean
  showAuthor?: boolean
  className?: string
  onLike?: (trackId: string) => void
  onShare?: (track: Track) => void
  onPlay?: (track: Track) => void
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

const difficultyLabels = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  variant = 'default',
  showActions = true,
  showStats = true,
  showAuthor = true,
  className = '',
  onLike,
  onShare,
  onPlay,
}) => {
  const extractTextContent = (description: any): string => {
    if (!description) return '暂无描述'
    
    if (typeof description === 'string') {
      return description.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
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
      return text.substring(0, 100) + (text.length > 100 ? '...' : '')
    }
    
    return '暂无描述'
  }

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return ''
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getUserInitials = (user?: Track['author']): string => {
    if (!user) return 'U'
    const name = user.name || user.email
    return name.charAt(0).toUpperCase()
  }

  const cardContent = (
    <Card className={`track-card hover:shadow-lg transition-all duration-300 ${className}`}>
      <CardHeader className={variant === 'compact' ? 'pb-2' : 'pb-4'}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-2 mb-2">
              {track.title}
            </h3>
            
            {variant !== 'compact' && (
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                {extractTextContent(track.description)}
              </p>
            )}
            
            {/* 标签和难度 */}
            <div className="flex flex-wrap gap-2 mb-3">
              {track.difficulty && (
                <Badge 
                  variant="secondary" 
                  className={difficultyColors[track.difficulty]}
                >
                  {difficultyLabels[track.difficulty]}
                </Badge>
              )}
              
              {track.category && (
                <Badge variant="outline">
                  {track.category}
                </Badge>
              )}
              
              {track.tags?.slice(0, 3).map((tag) => (
                <Badge 
                  key={tag.id} 
                  variant="secondary"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </Badge>
              ))}
              
              {track.tags && track.tags.length > 3 && (
                <Badge variant="outline">
                  +{track.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
          
          {track.duration && (
            <div className="text-sm text-muted-foreground ml-2">
              {formatDuration(track.duration)}
            </div>
          )}
        </div>
      </CardHeader>
      
      {variant === 'detailed' && (
        <CardContent className="pt-0">
          {/* 作者信息 */}
          {showAuthor && track.author && (
            <div className="flex items-center gap-2 mb-4">
              <Avatar className="w-6 h-6">
                <AvatarImage src={track.author.avatar} />
                <AvatarFallback className="text-xs">
                  {getUserInitials(track.author)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {track.author.name || track.author.email}
              </span>
            </div>
          )}
          
          {/* 统计信息 */}
          {showStats && track.stats && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center">
                <Music className="w-4 h-4 text-blue-500 mb-1" />
                <span className="text-sm font-medium">{track.stats.versionCount}</span>
                <span className="text-xs text-muted-foreground">版本</span>
              </div>
              <div className="flex flex-col items-center">
                <Heart className="w-4 h-4 text-red-500 mb-1" />
                <span className="text-sm font-medium">{track.stats.totalLikes}</span>
                <span className="text-xs text-muted-foreground">点赞</span>
              </div>
              <div className="flex flex-col items-center">
                <Eye className="w-4 h-4 text-green-500 mb-1" />
                <span className="text-sm font-medium">{track.stats.viewCount || 0}</span>
                <span className="text-xs text-muted-foreground">浏览</span>
              </div>
            </div>
          )}
        </CardContent>
      )}
      
      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          {/* 时间信息 */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              {formatDistanceToNow(new Date(track.createdAt), {
                addSuffix: true,
                locale: zhCN,
              })}
            </span>
          </div>
          
          {/* 操作按钮 */}
          {showActions && (
            <div className="flex items-center gap-1">
              {onPlay && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    onPlay(track)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Play className="w-3 h-3" />
                </Button>
              )}
              
              {onLike && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    onLike(track.id)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Heart className="w-3 h-3" />
                </Button>
              )}
              
              {onShare && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    onShare(track)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Share2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* 简化统计信息（非详细模式） */}
        {variant !== 'detailed' && showStats && track.stats && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 w-full">
            <div className="flex items-center gap-1">
              <Music className="w-3 h-3" />
              <span>{track.stats.versionCount} 版本</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span>{track.stats.totalLikes} 点赞</span>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )

  // 如果有 slug 或 id，包装为链接
  if (track.slug || track.id) {
    return (
      <Link href={`/tracks/${track.slug || track.id}`} className="block">
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {cardContent}
        </motion.div>
      </Link>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      {cardContent}
    </motion.div>
  )
}

export default TrackCard