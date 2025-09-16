'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, X, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'

interface EditNotification {
  id: string
  title: string
  message: string
  type: 'edit_submitted' | 'edit_approved' | 'edit_rejected' | 'content_rollback' | 'edit_conflict'
  read: boolean
  createdAt: string
  action_url?: string
  sender?: {
    id: string
    name: string
  }
}

interface EditNotificationsProps {
  userId?: string
}

const notificationTypeLabels = {
  edit_submitted: '编辑提交',
  edit_approved: '编辑通过',
  edit_rejected: '编辑拒绝',
  content_rollback: '内容回滚',
  edit_conflict: '编辑冲突',
}

const notificationTypeColors = {
  edit_submitted: 'bg-blue-500',
  edit_approved: 'bg-green-500',
  edit_rejected: 'bg-red-500',
  content_rollback: 'bg-orange-500',
  edit_conflict: 'bg-yellow-500',
}

export function EditNotifications({ userId }: EditNotificationsProps) {
  const [notifications, setNotifications] = useState<EditNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  // 获取通知列表
  const fetchNotifications = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/wiki/notifications/get', {
        method: 'GET',
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('获取通知失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 标记通知为已读
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/wiki/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ notificationId }),
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  // 删除通知
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch('/api/wiki/notifications/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ notificationId }),
      })
      
      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId)
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
        toast({
          title: '通知已删除',
          description: '通知已成功删除',
        })
      }
    } catch (error) {
      console.error('删除通知失败:', error)
      toast({
        title: '删除失败',
        description: '删除通知时发生错误',
        variant: 'destructive',
      })
    }
  }

  // 标记所有通知为已读
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/wiki/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include',
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        )
        setUnreadCount(0)
        toast({
          title: '全部已读',
          description: '所有通知已标记为已读',
        })
      }
    } catch (error) {
      console.error('标记全部已读失败:', error)
    }
  }

  // 处理通知点击
  const handleNotificationClick = (notification: EditNotification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    if (notification.action_url) {
      window.open(notification.action_url, '_blank')
    }
  }

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    
    return date.toLocaleDateString('zh-CN')
  }

  useEffect(() => {
    fetchNotifications()
    
    // 定期刷新通知
    const interval = setInterval(fetchNotifications, 30000) // 30秒刷新一次
    
    return () => clearInterval(interval)
  }, [userId])

  if (!userId) {
    return null
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <h3 className="font-semibold">编辑通知</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              全部已读
            </Button>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              暂无通知
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="relative">
                <DropdownMenuItem 
                  className={`flex flex-col items-start p-3 cursor-pointer ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            notificationTypeColors[notification.type]
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {notificationTypeLabels[notification.type]}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      
                      <h4 className="font-medium text-sm truncate">
                        {notification.title}
                      </h4>
                      
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.createdAt)}
                        </span>
                        
                        {notification.sender && (
                          <span className="text-xs text-muted-foreground">
                            来自: {notification.sender.name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
              </div>
            ))
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => {
                  setOpen(false)
                  // 可以跳转到通知管理页面
                }}
              >
                查看全部通知
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}