import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const depth = parseInt(searchParams.get('depth') || '2')
    const sort = searchParams.get('sort') || '-createdAt'

    const result = await payload.find({
      collection: 'comments',
      page,
      limit,
      sort,
      depth,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取评论失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const data = await request.json()

    // 获取当前用户
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return NextResponse.json(
        { message: '用户未认证' },
        { status: 401 }
      )
    }

    // 确保author字段存在
    const commentData = {
      ...data,
      author: data.author || user.id,
    }

    // 创建评论
    const result = await payload.create({
      collection: 'comments',
      data: commentData,
    })

    return NextResponse.json({ doc: result })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '创建评论失败' },
      { status: 500 }
    )
  }
}