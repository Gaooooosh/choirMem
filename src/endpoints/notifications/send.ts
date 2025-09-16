import payload from 'payload'
import { PayloadRequest } from 'payload'

interface NotificationData {
  title: string
  message: string
  type: 'edit_submitted' | 'edit_approved' | 'edit_rejected' | 'content_rollback' | 'edit_conflict' | 'system'
  recipient: string
  sender?: string
  related_collection?: 'tracks' | 'track-versions'
  related_document_id?: string
  related_field?: string
  action_url?: string
  metadata?: any
}

export const sendNotification = async (req: PayloadRequest): Promise<any> => {
  const { user } = req
  
  if (!user) {
    return {
      status: 401,
      json: { error: '未授权访问' }
    }
  }
  
  try {
    if (!req.json) {
      return {
        status: 400,
        json: { error: '无效请求' }
      }
    }
    
    const notificationData: NotificationData = await req.json()
    
    // 验证必需字段
    if (!notificationData.title || !notificationData.message || !notificationData.type || !notificationData.recipient) {
      return {
        status: 400,
        json: { error: '缺少必需字段' }
      }
    }
    
    // 创建通知
    const notification = await payload.create({
      collection: 'edit-notifications',
      data: {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        recipient: typeof notificationData.recipient === 'string' ? parseInt(notificationData.recipient) : notificationData.recipient,
        sender: typeof notificationData.sender === 'string' ? parseInt(notificationData.sender) : (notificationData.sender || user.id),
        related_collection: notificationData.related_collection,
        related_document_id: notificationData.related_document_id,
        related_field: notificationData.related_field,
        action_url: notificationData.action_url,
        metadata: notificationData.metadata,
        read: false,
      },
      req,
    })
    
    return {
      status: 200,
      json: {
        success: true,
        notification,
      }
    }
  } catch (error) {
    console.error('发送通知失败:', error)
    return {
      status: 500,
      json: { error: '发送通知失败' }
    }
  }
}

// 批量发送通知
export const sendBulkNotifications = async (req: PayloadRequest): Promise<any> => {
  const { user } = req
  
  if (!user) {
    return {
      status: 401,
      json: { error: '未授权访问' }
    }
  }
  
  try {
    if (!req.json) {
      return {
        status: 400,
        json: { error: '无效请求' }
      }
    }
    
    const { notifications }: { notifications: NotificationData[] } = await req.json()
    
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return {
        status: 400,
        json: { error: '无效的通知数据' }
      }
    }
    
    const results = []
    
    for (const notificationData of notifications) {
      // 验证必需字段
      if (!notificationData.title || !notificationData.message || !notificationData.type || !notificationData.recipient) {
        continue
      }
      
      try {
        const notification = await payload.create({
          collection: 'edit-notifications',
          data: {
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            recipient: typeof notificationData.recipient === 'string' ? parseInt(notificationData.recipient) : notificationData.recipient,
            sender: typeof notificationData.sender === 'string' ? parseInt(notificationData.sender) : (notificationData.sender || user.id),
            related_collection: notificationData.related_collection,
            related_document_id: notificationData.related_document_id,
            related_field: notificationData.related_field,
            action_url: notificationData.action_url,
            metadata: notificationData.metadata,
            read: false,
          },
          req,
        })
        
        results.push(notification)
      } catch (error) {
        console.error('创建单个通知失败:', error)
      }
    }
    
    return {
      status: 200,
      json: {
        success: true,
        created: results.length,
        notifications: results,
      }
    }
  } catch (error) {
    console.error('批量发送通知失败:', error)
    return {
      status: 500,
      json: { error: '批量发送通知失败' }
    }
  }
}