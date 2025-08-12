import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '未登录，请先登录' },
        { status: 401 }
      )
    }

    // 验证 token 并获取用户信息
    const { user } = await payload.auth({ 
      headers: new Headers({ 
        'Authorization': `JWT ${token}` 
      }) 
    })
    
    if (!user) {
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    if (!newPassword) {
      return NextResponse.json(
        { error: '新密码不能为空' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '新密码长度至少为6位' },
        { status: 400 }
      )
    }

    // 检查用户是否需要重置密码
    const needsPasswordReset = user.needs_password_reset === true
    
    // 如果不是临时密码用户，需要验证当前密码
    if (!needsPasswordReset) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: '请输入当前密码' },
          { status: 400 }
        )
      }
      
      // 验证当前密码
      try {
        await payload.login({
          collection: 'users',
          data: {
            email: user.email,
            password: currentPassword,
          },
        })
      } catch (error) {
        return NextResponse.json(
          { error: '当前密码不正确' },
          { status: 400 }
        )
      }
    }

    // 更新密码
    const updateData: any = {
      password: newPassword,
    }
    
    // 如果用户之前需要重置密码，现在标记为已完成
    if (needsPasswordReset) {
      updateData.needs_password_reset = false
    }
    
    await payload.update({
      collection: 'users',
      id: user.id,
      data: updateData,
    })

    return NextResponse.json({
      message: '密码修改成功',
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}