import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { name, bio } = await request.json()

    // 获取当前用户
    const token = request.cookies.get('payload-token')?.value
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 验证token并获取用户
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return NextResponse.json({ error: '用户未找到' }, { status: 404 })
    }

    // 更新用户信息
    const updatedUser = await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        name: name || '',
        bio: bio || ''
      }
    })

    return NextResponse.json({ 
      message: '个人信息更新成功',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        bio: updatedUser.bio
      }
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}