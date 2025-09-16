'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  RotateCcw,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getClientSideURL } from '@/utilities/getURL'

interface Notification {
  id: string
  title: string
  message: string
  type: 'edit_submitted' | 'edit_approved' | 'edit_rejected' | 'content_rollback' | 'edit_conflict'
  read: boolean
  read_at?: string
  action_url?: string
  createdAt: string
  sender?: {
    id: string
    name?: string
    email: string
  }
}

const payloadUrl = getClientSideURL()

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'edit_submitted':
      return <Info className="w-4 h-4 text-blue-500" />
    case 'edit_approved':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'edit_rejected':
      return <X className="w-4 h-4 text-red-500" />
    case 'content_rollback':
      return <RotateCcw className="w-4 h-4 text-orange-500" />
    case 'edit_conflict':
      return <AlertCircle className="w-4 h-4 text-yellow-500" />
    default:
      return <Bell className="w-4 h-4 text-gray-500" />
  }
}

const getNotificationTypeLabel = (type: string) => {
  switch (type) {
    case 'edit_submitted':
      return '编辑提交'
    case 'edit_approved':
      return '编辑通过'
    case 'edit_rejected':
      return '编辑拒绝'
    case 'content_rollback':
      return '内容回滚'
    case 'edit_conflict':
      return '编辑冲突'
    default:
      return '通知'
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) {
    return '刚刚'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}小时前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // 获取通知列表
  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${payloadUrl}/api/wiki/notifications`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.docs || [])
      }
    } catch (error) {
      console.error('获取通知失败:', error)
    }
  }

  // 获取未读通知数量
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${payloadUrl}/api/wiki/notifications/unread-count`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error('获取未读通知数量失败:', error)
    }
  }

  // 标记单个通知为已读
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`${payloadUrl}/api/wiki/notifications/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ notificationId }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true, read_at: new Date().toISOString() }
              : notification,
          ),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('标记通知已读失败:', error)
    }
  }

  // 标记所有通知为已读
  const markAllAsRead = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${payloadUrl}/api/wiki/notifications/read-all`, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            read: true,
            read_at: new Date().toISOString(),
          })),
        )
        setUnreadCount(0)
        toast({
          title: '已标记所有通知为已读',
        })
      }
    } catch (error) {
      console.error('标记所有通知已读失败:', error)
      toast({
        title: '操作失败',
        description: '无法标记所有通知为已读',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // 删除通知
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`${payloadUrl}/api/wiki/notifications/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ notificationId }),
      })

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        const notification = notifications.find((n) => n.id === notificationId)
        if (notification && !notification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('删除通知失败:', error)
    }
  }

  // 初始化和定期刷新
  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()

    // 每30秒刷新一次未读数量
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [])

  // 当打开通知中心时刷新通知列表
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">通知中心</h3>
            {notifications.some((n) => !n.read) && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={loading}>
                <CheckCheck className="w-4 h-4 mr-1" />
                全部已读
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>暂无通知</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {getNotificationTypeLabel(notification.type)}
                        </Badge>
                        {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                      </div>

                      <h4 className="font-medium text-sm mb-1">{notification.title}</h4>

                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(notification.createdAt)}
                        </span>

                        <div className="flex gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 px-2"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 px-2 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {notification.action_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 h-6 text-xs"
                          onClick={() => {
                            window.open(notification.action_url, '_blank')
                            if (!notification.read) {
                              markAsRead(notification.id)
                            }
                          }}
                        >
                          查看详情
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
