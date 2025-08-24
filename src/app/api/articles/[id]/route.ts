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
      collection: 'articles',
      id,
      depth: 2,
    })

    return NextResponse.json({ doc: result })
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取文章失败' },
      { status: 404 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({ config })
    const { id } = await params
    const data = await request.json()

    const result = await payload.update({
      collection: 'articles',
      id,
      data,
    })

    return NextResponse.json({ doc: result })
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '更新文章失败' },
      { status: 500 }
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
        { message: '未授权访问' },
        { status: 401 }
      )
    }

    // 获取文章信息以检查权限
    const article = await payload.findByID({
      collection: 'articles',
      id,
    })

    if (!article) {
      return NextResponse.json(
        { message: '文章不存在' },
        { status: 404 }
      )
    }

    // 检查权限：只有文章作者或管理员可以删除
    const isAuthor = user.id === (typeof article.author === 'object' ? article.author.id : article.author)
    const isAdmin = user.is_admin || false
    
    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { message: '权限不足，只有文章作者或管理员可以删除文章' },
        { status: 403 }
      )
    }

    await payload.delete({
      collection: 'articles',
      id,
    })

    return NextResponse.json({ message: '文章已删除' })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '删除文章失败' },
      { status: 500 }
    )
  }
}