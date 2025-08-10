import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    
    // 获取当前用户
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return NextResponse.json(
        { message: '用户未认证' },
        { status: 401 }
      )
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { message: '没有上传文件' },
        { status: 400 }
      )
    }

    // 将文件转换为 Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 创建媒体记录
    const result = await payload.create({
      collection: 'media',
      data: {
        alt: file.name,
        uploader: user.id,
      },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
    })

    return NextResponse.json({ doc: result })
  } catch (error) {
    console.error('Error uploading media:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '上传文件失败' },
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

    const result = await payload.find({
      collection: 'media',
      page,
      limit,
      sort: '-createdAt',
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取媒体失败' },
      { status: 500 }
    )
  }
}