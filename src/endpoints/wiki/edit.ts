import type { PayloadRequest } from 'payload'
import { getPayload } from 'payload'
import config from '@payload-config'

export const submitEdit = async (req: PayloadRequest): Promise<Response> => {
  const payload = await getPayload({ config })
  
  try {
    if (!req.json) {
      return Response.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    
    const body = await req.json()
    const {
      target_type,
      target_id,
      field_name,
      new_content,
      summary,
    } = body

    // 验证用户是否已认证
    if (!req.user) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

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

    // 检查是否启用了wiki编辑
    if (!targetDoc.wiki_enabled) {
      return Response.json(
        { error: 'Wiki editing is disabled for this item' },
        { status: 403 }
      )
    }

    // 检查是否被锁定
    if (targetDoc.is_locked && targetDoc.locked_by !== req.user.id) {
      return Response.json(
        { error: 'This item is currently locked by another user' },
        { status: 423 }
      )
    }

    const original_content = (targetDoc as any)[field_name]
    
    // 生成内容差异（简单的文本比较）
    const diff = generateDiff(original_content, new_content)

    // 检查是否需要审核
    const requiresApproval = targetDoc.requires_approval || await shouldRequireApproval(req.user, diff)

    if (requiresApproval) {
      // 创建待审核编辑
      const pendingEdit = await payload.create({
        collection: 'pending-edits' as any,
        data: {
          summary,
          editor: req.user.id,
          target_type,
          target_id,
          field_name,
          original_content,
          new_content,
          diff,
          status: 'pending' as any,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
          user_agent: req.headers.get('user-agent') || '',
        },
      })

      return Response.json({
        success: true,
        pending_approval: true,
        edit_id: pendingEdit.id,
        message: 'Edit submitted for review',
      })
    } else {
      // 直接应用编辑
      await applyEdit({
        payload,
        collection,
        target_id,
        field_name,
        new_content,
        editor: req.user,
        summary,
        original_content,
        diff,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
        user_agent: req.headers.get('user-agent') || '',
      })

      return Response.json({
        success: true,
        pending_approval: false,
        message: 'Edit applied successfully',
      })
    }
  } catch (error) {
    console.error('Error submitting edit:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const approveEdit = async (req: PayloadRequest): Promise<Response> => {
  const payload = await getPayload({ config })
  
  try {
    if (!req.json) {
      return Response.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    
    const body = await req.json()
    const { edit_id, action, review_comment } = body

    // 验证用户权限
    if (!req.user) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 检查审核权限
    const hasModeratePermission = await checkPermission(req.user, 'can_moderate_edits')
    if (!hasModeratePermission) {
      return Response.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 获取待审核编辑
    const pendingEdit = await payload.findByID({
      collection: 'pending-edits' as any,
      id: edit_id,
    })

    if (!pendingEdit || (pendingEdit as any).status !== 'pending') {
      return Response.json(
        { error: 'Pending edit not found or already processed' },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      // 应用编辑
      const collection = (pendingEdit as any).target_type === 'track_description' ? 'tracks' : 'track-versions'
      
      await applyEdit({
        payload,
        collection,
        target_id: (pendingEdit as any).target_id,
        field_name: (pendingEdit as any).field_name,
        new_content: (pendingEdit as any).new_content,
        editor: (pendingEdit as any).editor,
        summary: (pendingEdit as any).summary,
        original_content: (pendingEdit as any).original_content,
        diff: (pendingEdit as any).diff,
        ip_address: (pendingEdit as any).ip_address,
        user_agent: (pendingEdit as any).user_agent,
      })

      // 更新待审核编辑状态
      await payload.update({
        collection: 'pending-edits' as any,
        id: edit_id,
        data: {
          status: 'approved' as any,
          reviewer: req.user.id,
          review_comment,
          reviewed_at: new Date().toISOString(),
        },
      })

      return Response.json({
        success: true,
        message: 'Edit approved and applied',
      })
    } else if (action === 'reject') {
      // 拒绝编辑
      await payload.update({
        collection: 'pending-edits' as any,
        id: edit_id,
        data: {
          status: 'rejected' as any,
          reviewer: req.user.id,
          review_comment,
          reviewed_at: new Date().toISOString(),
        },
      })

      return Response.json({
        success: true,
        message: 'Edit rejected',
      })
    } else {
      return Response.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error processing edit approval:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 辅助函数
async function applyEdit({
  payload,
  collection,
  target_id,
  field_name,
  new_content,
  editor,
  summary,
  original_content,
  diff,
  ip_address,
  user_agent,
}: {
  payload: any
  collection: string
  target_id: string
  field_name: string
  new_content: any
  editor: any
  summary: string
  original_content: any
  diff: string
  ip_address: string
  user_agent: string
}) {
  // 更新目标文档
  const updateData: any = {
    [field_name]: new_content,
    last_editor: editor.id,
  }

  // 增加编辑版本号
  const currentDoc = await payload.findByID({
    collection,
    id: target_id,
  })
  updateData.edit_version = (currentDoc.edit_version || 1) + 1

  await payload.update({
    collection: collection as any,
    id: target_id,
    data: updateData,
  })

  // 创建编辑历史记录
  await payload.create({
    collection: 'edit-history' as any,
    data: {
      summary,
      editor: editor.id,
      target_type: collection === 'tracks' ? 'track_description' : 'track_version_notes',
      target_id,
      field_name,
      operation_type: 'edit' as any,
      content_before: original_content,
      content_after: new_content,
      diff,
      approval_status: 'auto_approved' as any,
      ip_address,
      user_agent,
    },
  })
}

function generateDiff(original: any, updated: any): string {
  // 简单的文本差异生成
  // 在实际应用中，可以使用更复杂的diff算法
  const originalText = typeof original === 'string' ? original : JSON.stringify(original)
  const updatedText = typeof updated === 'string' ? updated : JSON.stringify(updated)
  
  if (originalText === updatedText) {
    return 'No changes'
  }
  
  return `Original length: ${originalText.length}, Updated length: ${updatedText.length}`
}

async function shouldRequireApproval(user: any, diff: string): Promise<boolean> {
  // 实现自动审核逻辑
  // 例如：信任用户、小幅修改等可以自动通过
  
  // 简单示例：如果用户有特定权限，则不需要审核
  if (user.group?.can_moderate_edits) {
    return false
  }
  
  // 如果是小幅修改（例如少于100个字符的变化），可以自动通过
  if (diff.includes('length') && Math.abs(parseInt(diff.split('Updated length: ')[1]) - parseInt(diff.split('Original length: ')[1].split(',')[0])) < 100) {
    return false
  }
  
  return true
}

async function checkPermission(user: any, permission: string): Promise<boolean> {
  if (!user.group) {
    return false
  }
  
  return user.group[permission] === true
}