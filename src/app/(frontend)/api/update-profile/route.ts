import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { currentPassword, newEmail, newPassword } = await request.json()

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

    // 验证当前密码 - 使用Payload的登录验证
    try {
      await payload.login({
        collection: 'users',
        data: {
          email: user.email,
          password: currentPassword
        }
      })
    } catch (error) {
      return NextResponse.json({ error: '当前密码不正确' }, { status: 400 })
    }

    // 检查新邮箱是否已被使用
    const existingUser = await payload.find({
      collection: 'users',
      where: {
        and: [
          { email: { equals: newEmail } },
          { id: { not_equals: user.id } }
        ]
      }
    })

    if (existingUser.docs.length > 0) {
      return NextResponse.json({ error: '该邮箱已被其他用户使用' }, { status: 400 })
    }

    // 更新用户信息 - Payload会自动处理密码加密
    const updatedUser = await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        email: newEmail,
        password: newPassword
      }
    })

    return NextResponse.json({ 
      message: '个人信息更新成功',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name
      }
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}