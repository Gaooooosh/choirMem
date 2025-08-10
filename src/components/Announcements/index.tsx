'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import { useTheme } from '@/providers/Theme'
import { getClientSideURL } from '@/utilities/getURL'

interface Announcement {
  id: string
  title: string
  content: string
  status: 'draft' | 'published'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  showOnHomepage: boolean
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

const payloadUrl = getClientSideURL()

const priorityConfig = {
  low: {
    icon: Info,
    bgClass: 'from-blue-500/10 to-blue-600/10 border-blue-500/20',
    iconClass: 'text-blue-500',
    textClass: 'text-blue-900 dark:text-blue-100',
  },
  medium: {
    icon: CheckCircle,
    bgClass: 'from-green-500/10 to-green-600/10 border-green-500/20',
    iconClass: 'text-green-500',
    textClass: 'text-green-900 dark:text-green-100',
  },
  high: {
    icon: AlertTriangle,
    bgClass: 'from-orange-500/10 to-orange-600/10 border-orange-500/20',
    iconClass: 'text-orange-500',
    textClass: 'text-orange-900 dark:text-orange-100',
  },
  urgent: {
    icon: AlertCircle,
    bgClass: 'from-red-500/10 to-red-600/10 border-red-500/20',
    iconClass: 'text-red-500',
    textClass: 'text-red-900 dark:text-red-100',
  },
}

export const AnnouncementBanner: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const { theme } = useTheme()
  const currentTheme = theme || 'light'

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch(
          `${payloadUrl}/api/announcements?where[status][equals]=published&where[showOnHomepage][equals]=true&sort=-priority,-createdAt`,
        )
        if (response.ok) {
          const data = await response.json()
          const validAnnouncements = data.docs.filter((announcement: Announcement) => {
            // 检查是否已过期
            if (announcement.expiresAt) {
              const expiryDate = new Date(announcement.expiresAt)
              const now = new Date()
              return expiryDate > now
            }
            return true
          })
          setAnnouncements(validAnnouncements)
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error)
      }
    }

    fetchAnnouncements()
  }, [])

  useEffect(() => {
    // 从 localStorage 读取已关闭的公告
    const dismissed = localStorage.getItem('dismissedAnnouncements')
    if (dismissed) {
      setDismissedIds(JSON.parse(dismissed))
    }
  }, [])

  const dismissAnnouncement = (id: string) => {
    const newDismissedIds = [...dismissedIds, id]
    setDismissedIds(newDismissedIds)
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissedIds))
  }

  const visibleAnnouncements = announcements.filter(
    (announcement) => !dismissedIds.includes(announcement.id),
  )

  if (visibleAnnouncements.length === 0) {
    return null
  }

  return (
    <div className="w-full max-w-3xl mx-auto mb-6">
      <AnimatePresence>
        {visibleAnnouncements.map((announcement, index) => {
          const config = priorityConfig[announcement.priority] || priorityConfig.medium
          const Icon = config.icon

          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
              className={`relative mb-4 backdrop-blur-xl border rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ${
                currentTheme === 'dark'
                  ? `bg-gradient-to-r ${config.bgClass} border-white/10 hover:border-white/20 hover:bg-white/5`
                  : `bg-gradient-to-r ${config.bgClass} border-black/10 hover:border-black/20 hover:bg-white/10`
              }`}
              style={{
                boxShadow:
                  currentTheme === 'dark'
                    ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              }}
            >
              <div className="p-4 pr-12">
                <div className="flex items-start space-x-3">
                  <Icon
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${config.iconClass}`}
                  />
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold text-lg mb-1 transition-colors duration-200 ${config.textClass}`}
                    >
                      {announcement.title}
                    </h3>
                    <div className={`text-sm leading-relaxed ${config.textClass} opacity-90`}>
                      {(() => {
                        console.log('Announcement content:', announcement.content)
                        console.log('Content type:', typeof announcement.content)

                        if (typeof announcement.content === 'string') {
                          // 如果是字符串，先尝试解析为JSON
                          try {
                            const parsed = JSON.parse(announcement.content)
                            console.log('Parsed content:', parsed)

                            // 解析 Lexical 编辑器的 JSON 结构
                            const extractText = (node: any): string => {
                              if (!node) return ''

                              if (typeof node === 'string') {
                                return node
                              }

                              if (node.text) {
                                return node.text
                              }

                              if (node.children && Array.isArray(node.children)) {
                                return node.children.map(extractText).join('')
                              }

                              if (node.root && node.root.children) {
                                return extractText(node.root)
                              }

                              return ''
                            }

                            const extractedText = extractText(parsed)
                            console.log('Extracted text:', extractedText)
                            return extractedText || announcement.content
                          } catch (error) {
                            console.log('Failed to parse as JSON, treating as plain text')
                            return announcement.content
                          }
                        }

                        // 如果是对象，直接解析
                        if (typeof announcement.content === 'object') {
                          const extractText = (node: any): string => {
                            if (!node) return ''

                            if (node.text) {
                              return node.text
                            }

                            if (node.children && Array.isArray(node.children)) {
                              return node.children.map(extractText).join('')
                            }

                            if (node.root && node.root.children) {
                              return extractText(node.root)
                            }

                            return ''
                          }

                          const extractedText = extractText(announcement.content)
                          console.log('Extracted text from object:', extractedText)
                          return extractedText || JSON.stringify(announcement.content)
                        }

                        return String(announcement.content)
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  dismissAnnouncement(announcement.id)
                }}
                className={`absolute top-3 right-3 p-1.5 rounded-full transition-all duration-200 opacity-60 hover:opacity-100 hover:scale-110 ${
                  currentTheme === 'dark'
                    ? 'hover:bg-white/10 text-white/60 hover:text-white/80'
                    : 'hover:bg-black/10 text-black/60 hover:text-black/80'
                }`}
                aria-label="关闭公告"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default AnnouncementBanner
