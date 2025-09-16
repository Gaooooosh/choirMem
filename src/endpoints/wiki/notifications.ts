import { PayloadRequest } from 'payload'
import { User } from '../../payload-types'

// 发送编辑通知
export const sendEditNotification = async (req: PayloadRequest) => {
  try {
    const body = await req.json()
    const { type, recipientId, senderId, title, message, relatedCollection, relatedDocumentId, relatedField, actionUrl, metadata } = body

    if (!type || !recipientId || !title || !message) {
      return Response.json(
        { error: '缺少必需参数' },
        { status: 400 }
      )
    }

    // 创建通知
    const notification = await req.payload.create({
      collection: 'edit-notifications',
      data: {
        type,
        title,
        message,
        recipient: recipientId,
        sender: senderId,
        related_collection: relatedCollection,
        related_document_id: relatedDocumentId,
        related_field: relatedField,
        action_url: actionUrl,
        metadata,
        read: false,
      },
    })

    return Response.json({ success: true, notification })
  } catch (error) {
    console.error('发送通知失败:', error)
    return Response.json(
      { error: '发送通知失败' },
      { status: 500 }
    )
  }
}

// 获取用户通知
export const getUserNotifications = async (req: PayloadRequest) => {
  try {
    const user = req.user as User
    if (!user) {
      return Response.json(
        { error: '未授权' },
        { status: 401 }
      )
    }

    const url = new URL(req.url || '')
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const page = parseInt(url.searchParams.get('page') || '1')

    const where: any = {
      recipient: {
        equals: user.id,
      },
    }

    if (unreadOnly) {
      where.read = {
        equals: false,
      }
    }

    const notifications = await req.payload.find({
      collection: 'edit-notifications',
      where,
      limit,
      page,
      sort: '-createdAt',
      populate: {
        sender: true,
      },
    })

    return Response.json(notifications)
  } catch (error) {
    console.error('获取通知失败:', error)
    return Response.json(
      { error: '获取通知失败' },
      { status: 500 }
    )
  }
}

// 标记通知为已读
export const markNotificationAsRead = async (req: PayloadRequest) => {
  try {
    const body = await req.json()
    const { notificationId } = body
    const user = req.user as User

    if (!user) {
      return Response.json(
        { error: '未授权' },
        { status: 401 }
      )
    }

    if (!notificationId) {
      return Response.json(
        { error: '缺少通知ID' },
        { status: 400 }
      )
    }

    // 验证通知属于当前用户
    const notification = await req.payload.findByID({
      collection: 'edit-notifications',
      id: notificationId,
    })

    if (!notification || notification.recipient !== user.id) {
      return Response.json(
        { error: '通知不存在或无权限' },
        { status: 404 }
      )
    }

    // 更新通知状态
    const updatedNotification = await req.payload.update({
      collection: 'edit-notifications',
      id: notificationId,
      data: {
        read: true,
        read_at: new Date().toISOString(),
      },
    })

    return Response.json({ success: true, notification: updatedNotification })
  } catch (error) {
    console.error('标记通知已读失败:', error)
    return Response.json(
      { error: '标记通知已读失败' },
      { status: 500 }
    )
  }
}

// 批量标记通知为已读
export const markAllNotificationsAsRead = async (req: PayloadRequest) => {
  try {
    const user = req.user as User
    if (!user) {
      return Response.json(
        { error: '未授权' },
        { status: 401 }
      )
    }

    // 获取用户所有未读通知
    const unreadNotifications = await req.payload.find({
      collection: 'edit-notifications',
      where: {
        recipient: {
          equals: user.id,
        },
        read: {
          equals: false,
        },
      },
      limit: 1000, // 假设不会有超过1000个未读通知
    })

    // 批量更新
    const updatePromises = unreadNotifications.docs.map((notification) =>
      req.payload.update({
        collection: 'edit-notifications',
        id: notification.id,
        data: {
          read: true,
          read_at: new Date().toISOString(),
        },
      })
    )

    await Promise.all(updatePromises)

    return Response.json({ 
      success: true, 
      updatedCount: unreadNotifications.docs.length 
    })
  } catch (error) {
    console.error('批量标记通知已读失败:', error)
    return Response.json(
      { error: '批量标记通知已读失败' },
      { status: 500 }
    )
  }
}

// 删除通知
export const deleteNotification = async (req: PayloadRequest) => {
  try {
    const body = await req.json()
    const { notificationId } = body
    const user = req.user as User

    if (!user) {
      return Response.json(
        { error: '未授权' },
        { status: 401 }
      )
    }

    if (!notificationId) {
      return Response.json(
        { error: '缺少通知ID' },
        { status: 400 }
      )
    }

    // 验证通知属于当前用户或用户是管理员
    const notification = await req.payload.findByID({
      collection: 'edit-notifications',
      id: notificationId,
    })

    if (!notification) {
      return Response.json(
        { error: '通知不存在' },
        { status: 404 }
      )
    }

    const isOwner = notification.recipient === user.id
    const isAdmin = (user as any).role === 'admin'

    if (!isOwner && !isAdmin) {
      return Response.json(
        { error: '无权限删除此通知' },
        { status: 403 }
      )
    }

    await req.payload.delete({
      collection: 'edit-notifications',
      id: notificationId,
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('删除通知失败:', error)
    return Response.json(
      { error: '删除通知失败' },
      { status: 500 }
    )
  }
}

// 获取未读通知数量
export const getUnreadNotificationCount = async (req: PayloadRequest) => {
  try {
    const user = req.user as User
    if (!user) {
      return Response.json(
        { error: '未授权' },
        { status: 401 }
      )
    }

    const result = await req.payload.find({
      collection: 'edit-notifications',
      where: {
        recipient: {
          equals: user.id,
        },
        read: {
          equals: false,
        },
      },
      limit: 0, // 只获取总数
    })

    return Response.json({ count: result.totalDocs })
  } catch (error) {
    console.error('获取未读通知数量失败:', error)
    return Response.json(
      { error: '获取未读通知数量失败' },
      { status: 500 }
    )
  }
}

// 通知工具函数
export const notificationUtils = {
  // 发送编辑提交通知
  async sendEditSubmittedNotification(payload: any, editData: any) {
    try {
      // 获取文档的所有关注者或管理员
      const admins = await payload.find({
        collection: 'users',
        where: {
          role: {
            equals: 'admin',
          },
        },
      })

      const notifications = admins.docs.map((admin: any) => ({
        type: 'edit_submitted',
        title: '新的编辑提交',
        message: `用户 ${editData.editor.name || editData.editor.email} 提交了一个新的编辑`,
        recipient: admin.id,
        sender: editData.editor.id,
        related_collection: editData.collection,
        related_document_id: editData.document_id,
        related_field: editData.field_name,
        action_url: `/admin/collections/pending-edits/${editData.id}`,
        metadata: {
          editId: editData.id,
        },
      }))

      // 批量创建通知
      await Promise.all(
        notifications.map((notificationData: any) =>
          payload.create({
            collection: 'edit-notifications',
            data: notificationData,
          })
        )
      )
    } catch (error) {
      console.error('发送编辑提交通知失败:', error)
    }
  },

  // 发送编辑审核结果通知
  async sendEditReviewNotification(payload: any, editData: any, approved: boolean, reviewer: any) {
    try {
      const notification = {
        type: approved ? 'edit_approved' : 'edit_rejected',
        title: approved ? '编辑已通过审核' : '编辑被拒绝',
        message: approved 
          ? `您的编辑已被 ${reviewer.name || reviewer.email} 审核通过`
          : `您的编辑被 ${reviewer.name || reviewer.email} 拒绝`,
        recipient: editData.editor.id,
        sender: reviewer.id,
        related_collection: editData.collection,
        related_document_id: editData.document_id,
        related_field: editData.field_name,
        action_url: approved 
          ? `/tracks/${editData.document_id}` 
          : `/admin/collections/pending-edits/${editData.id}`,
        metadata: {
          editId: editData.id,
          approved,
        },
      }

      await payload.create({
        collection: 'edit-notifications',
        data: notification,
      })
    } catch (error) {
      console.error('发送编辑审核通知失败:', error)
    }
  },

  // 发送内容回滚通知
  async sendRollbackNotification(payload: any, rollbackData: any) {
    try {
      // 通知相关的编辑者
      const affectedEditors = await payload.find({
        collection: 'edit-history',
        where: {
          collection: {
            equals: rollbackData.collection,
          },
          document_id: {
            equals: rollbackData.document_id,
          },
          field_name: {
            equals: rollbackData.field_name,
          },
          edit_version: {
            greater_than: rollbackData.target_version,
          },
        },
        populate: {
          editor: true,
        },
      })

      const uniqueEditors = new Set()
      const notifications = affectedEditors.docs
        .filter((edit: any) => {
          if (uniqueEditors.has(edit.editor.id)) {
            return false
          }
          uniqueEditors.add(edit.editor.id)
          return true
        })
        .map((edit: any) => ({
          type: 'content_rollback',
          title: '内容已回滚',
          message: `您编辑的内容已被回滚到版本 ${rollbackData.target_version}`,
          recipient: edit.editor.id,
          sender: rollbackData.operator.id,
          related_collection: rollbackData.collection,
          related_document_id: rollbackData.document_id,
          related_field: rollbackData.field_name,
          action_url: `/tracks/${rollbackData.document_id}`,
          metadata: {
            targetVersion: rollbackData.target_version,
          },
        }))

      await Promise.all(
        notifications.map((notificationData: any) =>
          payload.create({
            collection: 'edit-notifications',
            data: notificationData,
          })
        )
      )
    } catch (error) {
      console.error('发送回滚通知失败:', error)
    }
  },

  // 发送编辑冲突通知
  async sendEditConflictNotification(payload: any, conflictData: any) {
    try {
      const notification = {
        type: 'edit_conflict',
        title: '编辑冲突',
        message: `您正在编辑的内容与 ${conflictData.otherEditor.name || conflictData.otherEditor.email} 的编辑发生冲突`,
        recipient: conflictData.currentEditor.id,
        sender: conflictData.otherEditor.id,
        related_collection: conflictData.collection,
        related_document_id: conflictData.document_id,
        related_field: conflictData.field_name,
        action_url: `/tracks/${conflictData.document_id}`,
        metadata: {
          conflictType: 'edit_lock',
        },
      }

      await payload.create({
        collection: 'edit-notifications',
        data: notification,
      })
    } catch (error) {
      console.error('发送编辑冲突通知失败:', error)
    }
  },
}