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

    // 构建查询条件
    const where: any = {}
    const trackVersionId = searchParams.get('track_version')
    if (trackVersionId) {
      where.track_version = {
        equals: parseInt(trackVersionId)
      }
    }

    const result = await payload.find({
      collection: 'scores',
      page,
      limit,
      sort,
      depth,
      where: Object.keys(where).length > 0 ? where : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching scores:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取乐谱失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const formData = await request.formData()

    // 获取当前用户
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return NextResponse.json(
        { message: '用户未认证' },
        { status: 401 }
      )
    }

    // 从 FormData 中提取数据
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const trackVersionId = formData.get('track_version') as string
    const alt = formData.get('alt') as string

    if (!file) {
      return NextResponse.json(
        { message: '未提供文件' },
        { status: 400 }
      )
    }

    if (!title) {
      return NextResponse.json(
        { message: '标题不能为空' },
        { status: 400 }
      )
    }

    if (!trackVersionId) {
      return NextResponse.json(
        { message: '曲目版本ID不能为空' },
        { status: 400 }
      )
    }

    // 构建乐谱数据
    const scoreData = {
      title,
      description,
      track_version: parseInt(trackVersionId),
      uploader: user.id,
      alt: alt || title,
    }

    // 创建乐谱记录，Payload 会自动处理文件上传
    const result = await payload.create({
      collection: 'scores',
      data: scoreData,
      file: {
        data: Buffer.from(await file.arrayBuffer()),
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
    })

    return NextResponse.json({ doc: result })
  } catch (error) {
    console.error('Error creating score:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '创建乐谱失败' },
      { status: 500 }
    )
  }
}