import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await getPayload({ config })
    const { id } = params

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
  { params }: { params: { id: string } }
) {
  try {
    const payload = await getPayload({ config })
    const { id } = params
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
  { params }: { params: { id: string } }
) {
  try {
    const payload = await getPayload({ config })
    const { id } = params

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