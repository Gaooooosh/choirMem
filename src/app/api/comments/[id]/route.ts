import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({ config })
    const { id } = await params

    const result = await payload.findByID({
      collection: 'comments',
      id,
      depth: 2,
    })

    return NextResponse.json({ doc: result })
  } catch (error) {
    console.error('Error fetching comment:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取评论失败' },
      { status: 404 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({ config })
    const { id } = await params

    // 获取当前用户
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return NextResponse.json(
        { message: '用户未认证' },
        { status: 401 }
      )
    }

    // 获取评论信息
    const comment = await payload.findByID({
      collection: 'comments',
      id,
      depth: 1,
    })

    if (!comment) {
      return NextResponse.json(
        { message: '评论不存在' },
        { status: 404 }
      )
    }

    // 检查权限：只有评论作者或管理员可以删除
    const authorId = typeof comment.author === 'object' ? comment.author.id : comment.author
    if (String(user.id) !== String(authorId) && !user.is_admin) {
      return NextResponse.json(
        { message: '没有权限删除此评论' },
        { status: 403 }
      )
    }

    // 删除评论
    await payload.delete({
      collection: 'comments',
      id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '删除评论失败' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({ config })
    const { id } = await params
    const data = await request.json()

    // 获取当前用户
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return NextResponse.json(
        { message: '用户未认证' },
        { status: 401 }
      )
    }

    // 获取评论信息
    const comment = await payload.findByID({
      collection: 'comments',
      id,
      depth: 1,
    })

    if (!comment) {
      return NextResponse.json(
        { message: '评论不存在' },
        { status: 404 }
      )
    }

    // 检查权限：只有评论作者或管理员可以编辑
    const authorId = typeof comment.author === 'object' ? comment.author.id : comment.author
    if (String(user.id) !== String(authorId) && !user.is_admin) {
      return NextResponse.json(
        { message: '没有权限编辑此评论' },
        { status: 403 }
      )
    }

    // 更新评论
    const result = await payload.update({
      collection: 'comments',
      id,
      data,
    })

    return NextResponse.json({ doc: result })
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '更新评论失败' },
      { status: 500 }
    )
  }
}