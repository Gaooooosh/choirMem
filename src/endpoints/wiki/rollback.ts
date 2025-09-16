import { PayloadRequest, getPayload } from 'payload'
import config from '@payload-config'
import { hasPermission } from '../../access/hasPermission'

/**
 * 回滚到指定的历史版本
 */
export const rollbackToVersion = async (req: PayloadRequest): Promise<Response> => {
  const payload = await getPayload({ config })
  
  try {
    if (!req.json) {
      return Response.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    
    const body = await req.json()
    const { history_id, rollback_summary } = body

    // 验证用户是否已认证
    if (!req.user) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 获取历史记录
    const historyRecord = await payload.findByID({
      collection: 'edit-history' as any,
      id: history_id,
    })

    if (!historyRecord) {
      return Response.json(
        { error: 'History record not found' },
        { status: 404 }
      )
    }

    const {
      target_type,
      target_id,
      field_name,
      content_before,
    } = historyRecord as any

    // 获取目标文档
    const collection = target_type === 'track_description' ? 'tracks' : 'track-versions'
    const targetDoc = await payload.findByID({
      collection: collection as any,
      id: target_id,
    })

    if (!targetDoc) {
      return Response.json(
        { error: 'Target document not found' },
        { status: 404 }
      )
    }

    // 检查文档是否被锁定
    if ((targetDoc as any).is_locked) {
      const lockedBy = (targetDoc as any).locked_by
      if (lockedBy !== req.user.id) {
        return Response.json(
          { error: 'Document is locked by another user' },
          { status: 423 }
        )
      }
    }

    // 检查是否需要审核权限（如果文档需要审核）
    if ((targetDoc as any).requires_approval) {
      const canModerate = hasPermission('can_moderate_edits')({ req })
      
      if (!canModerate) {
        return Response.json(
          { error: 'Moderation permission required for this document' },
          { status: 403 }
        )
      }
    }

    const current_content = (targetDoc as any)[field_name]
    
    // 生成回滚差异
    const diff = generateDiff(current_content, content_before)

    // 应用回滚
    const updateData: any = {
      [field_name]: content_before,
      last_editor: req.user.id,
      edit_version: ((targetDoc as any).edit_version || 0) + 1,
    }

    await payload.update({
      collection: collection as any,
      id: target_id,
      data: updateData,
    })

    // 创建回滚历史记录
    await payload.create({
      collection: 'edit-history' as any,
      data: {
        summary: rollback_summary || `Rolled back to version from ${new Date((historyRecord as any).createdAt).toLocaleString()}`,
        editor: req.user.id,
        target_type,
        target_id,
        field_name,
        operation_type: 'rollback' as any,
        content_before: current_content,
        content_after: content_before,
        diff,
        approval_status: 'auto_approved' as any,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
        user_agent: req.headers.get('user-agent') || '',
        rollback_to_version: history_id,
      },
    })

    // 发送回滚通知
    try {
      await payload.create({
        collection: 'edit-notifications',
        data: {
          title: '内容已回滚',
          message: `${req.user.name || '用户'} 将 ${target_type === 'track_description' ? '曲目' : '版本'} 的 ${field_name} 内容回滚到了历史版本`,
          type: 'content_rollback',
          recipient: req.user.id, // 通知操作者自己
          sender: req.user.id,
          related_collection: target_type.split('_')[0],
          related_document_id: target_id,
          action_url: `/admin/collections/${target_type.split('_')[0]}/${target_id}`,
          read: false,
        },
      })
    } catch (notificationError) {
      console.error('发送回滚通知失败:', notificationError)
    }

    return Response.json({
      success: true,
      message: 'Content rolled back successfully',
      new_version: updateData.edit_version,
    })

  } catch (error) {
    console.error('Rollback error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 获取文档的编辑历史
 */
export const getEditHistory = async (req: PayloadRequest): Promise<Response> => {
  const payload = await getPayload({ config })
  
  try {
    const url = new URL(req.url || '')
    const target_type = url.searchParams.get('target_type')
    const target_id = url.searchParams.get('target_id')
    const field_name = url.searchParams.get('field_name')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    if (!target_type || !target_id || !field_name) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // 获取编辑历史
    const history = await payload.find({
      collection: 'edit-history' as any,
      where: {
        and: [
          { target_type: { equals: target_type } },
          { target_id: { equals: target_id } },
          { field_name: { equals: field_name } },
        ],
      },
      sort: '-createdAt',
      page,
      limit,
      // Note: Populate relationships if needed
      // populate: ['editor', 'reviewer'],
    })

    return Response.json({
      success: true,
      history: history.docs,
      pagination: {
        page: history.page,
        limit: history.limit,
        totalPages: history.totalPages,
        totalDocs: history.totalDocs,
        hasNextPage: history.hasNextPage,
        hasPrevPage: history.hasPrevPage,
      },
    })

  } catch (error) {
    console.error('Get history error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 简单的文本差异生成函数
 */
function generateDiff(oldText: string, newText: string): string {
  if (!oldText && !newText) return 'No changes'
  if (!oldText) return `Added: ${newText.substring(0, 100)}...`
  if (!newText) return `Removed: ${oldText.substring(0, 100)}...`
  
  if (oldText === newText) return 'No changes'
  
  return `Changed from: ${oldText.substring(0, 50)}... to: ${newText.substring(0, 50)}...`
}