import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const data = await request.json()

    console.log('Received article data:', JSON.stringify(data, null, 2))
    console.log('User object from data:', data.author)
    console.log('Data keys:', Object.keys(data))

    // 获取当前用户
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return NextResponse.json(
        { message: '用户未认证' },
        { status: 401 }
      )
    }

    // 确保author字段存在
    const articleData = {
      ...data,
      author: data.author || user.id,
    }

    console.log('Final article data:', JSON.stringify(articleData, null, 2))

    // 创建文章
    const result = await payload.create({
      collection: 'articles',
      data: articleData,
    })

    return NextResponse.json({ doc: result })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '创建文章失败' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'published'

    const where: any = {
      status: {
        equals: status,
      },
    }

    if (search) {
      where.or = [
        {
          title: {
            contains: search,
          },
        },
      ]
    }

    const result = await payload.find({
      collection: 'articles',
      where,
      page,
      limit,
      sort: '-createdAt',
      depth: 2,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取文章失败' },
      { status: 500 }
    )
  }
}