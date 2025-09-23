import type { PayloadRequest } from 'payload'
import { hasPermission } from '../../access/hasPermission'

export const lockDocument = async (req: PayloadRequest): Promise<any> => {
  const { payload, user } = req
  
  let body: any = {}
  try {
    if (req.json) {
      body = await req.json()
    }
  } catch (e) {
    // Handle case where req.json is not available
  }
  
  const { collection, documentId } = body

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 检查用户权限
  const hasEditPermission = await hasPermission('can_edit_wiki')({ req })
  if (!hasEditPermission) {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  if (!collection || !documentId) {
    return Response.json({ error: 'Collection and documentId are required' }, { status: 400 })
  }

  try {
    // 检查是否已被其他用户锁定
    const existingLock = await payload.find({
      collection: 'edit-locks',
      where: {
        and: [
          { collection: { equals: collection } },
          { document_id: { equals: documentId } },
          { expires_at: { greater_than: new Date() } }
        ]
      }
    })

    if (existingLock.docs.length > 0) {
      const lock = existingLock.docs[0]
      if (lock.user !== user.id) {
        return Response.json({
          error: 'Document is locked by another user',
          lockedBy: lock.user,
          expiresAt: lock.expires_at
        }, { status: 409 })
      }
      
      // 如果是同一用户，延长锁定时间
      const updatedLock = await payload.update({
        collection: 'edit-locks',
        id: lock.id,
        data: {
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30分钟
        }
      })
      
      return Response.json({ lock: updatedLock })
    }

    // 创建新的锁定
    const newLock = await payload.create({
      collection: 'edit-locks',
      data: {
        collection,
        document_id: documentId,
        user: user.id,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30分钟
      }
    })

    return Response.json({ lock: newLock })
  } catch (error) {
    console.error('Error locking document:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const unlockDocument = async (req: PayloadRequest): Promise<any> => {
  const { payload, user } = req
  
  let body: any = {}
  try {
    if (req.json) {
      body = await req.json()
    }
  } catch (e) {
    // Handle case where req.json is not available
  }
  
  const { collection, documentId } = body

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!collection || !documentId) {
    return Response.json({ error: 'Collection and documentId are required' }, { status: 400 })
  }

  try {
    // 查找并删除用户的锁定
    const existingLock = await payload.find({
      collection: 'edit-locks',
      where: {
        and: [
          { collection: { equals: collection } },
          { document_id: { equals: documentId } },
          { user: { equals: user.id } }
        ]
      }
    })

    if (existingLock.docs.length > 0) {
      await payload.delete({
        collection: 'edit-locks',
        id: existingLock.docs[0].id
      })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error unlocking document:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const checkLockStatus = async (req: PayloadRequest): Promise<any> => {
  const { payload } = req
  const { collection, documentId } = req.query

  if (!collection || !documentId) {
    return Response.json({ error: 'Collection and documentId are required' }, { status: 400 })
  }

  try {
    // 清理过期的锁定
    await payload.delete({
      collection: 'edit-locks',
      where: {
        expires_at: { less_than: new Date() }
      }
    })

    // 检查当前锁定状态
    const existingLock = await payload.find({
      collection: 'edit-locks',
      where: {
        and: [
          { collection: { equals: collection } },
          { document_id: { equals: documentId } },
          { expires_at: { greater_than: new Date() } }
        ]
      },
      depth: 1
    })

    if (existingLock.docs.length > 0) {
      const lock = existingLock.docs[0]
      return Response.json({
        isLocked: true,
        lockedBy: lock.user,
        expiresAt: lock.expires_at
      })
    }

    return Response.json({ isLocked: false })
  } catch (error) {
    console.error('Error checking lock status:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}