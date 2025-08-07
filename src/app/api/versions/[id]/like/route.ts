import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await getPayload({ config: configPromise })
    const cookieStore = cookies()
    
    // 获取当前用户
    const { user } = await payload.auth({ headers: request.headers })
    
    if (!user) {
      return NextResponse.json({ error: '用户未登录' }, { status: 401 })
    }

    const versionId = params.id
    
    // 获取当前版本
    const version = await payload.findByID({
      collection: 'track-versions',
      id: versionId,
    })

    if (!version) {
      return NextResponse.json({ error: '版本不存在' }, { status: 404 })
    }

    // 检查用户是否已经点赞
    const currentLikes = version.likes || []
    const userLiked = currentLikes.some((like: any) => {
      const likeUserId = typeof like === 'object' ? like.id : like
      return likeUserId.toString() === user.id.toString()
    })

    let updatedLikes
    let action

    if (userLiked) {
      // 取消点赞
      updatedLikes = currentLikes.filter((like: any) => {
        const likeUserId = typeof like === 'object' ? like.id : like
        return likeUserId.toString() !== user.id.toString()
      })
      action = 'unliked'
    } else {
      // 添加点赞
      updatedLikes = [...currentLikes, user.id]
      action = 'liked'
    }

    // 更新版本的点赞列表
    await payload.update({
      collection: 'track-versions',
      id: versionId,
      data: {
        likes: updatedLikes,
      },
    })

    return NextResponse.json({
      success: true,
      action,
      likeCount: updatedLikes.length,
      liked: action === 'liked',
    })
  } catch (error) {
    console.error('点赞操作失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: request.headers })
    
    const versionId = params.id
    
    // 获取当前版本的点赞信息
    const version = await payload.findByID({
      collection: 'track-versions',
      id: versionId,
    })

    if (!version) {
      return NextResponse.json({ error: '版本不存在' }, { status: 404 })
    }

    const currentLikes = version.likes || []
    const likeCount = currentLikes.length
    
    let liked = false
    if (user) {
      liked = currentLikes.some((like: any) => {
        const likeUserId = typeof like === 'object' ? like.id : like
        return likeUserId.toString() === user.id.toString()
      })
    }

    return NextResponse.json({
      likeCount,
      liked,
    })
  } catch (error) {
    console.error('获取点赞信息失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}