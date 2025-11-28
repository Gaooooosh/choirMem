import type { PayloadHandler } from 'payload'
import type { User } from '@/payload-types'
import { APIError } from 'payload'
import crypto from 'crypto'
import { getServerSideURL } from '@/utilities/getURL'

export const register: PayloadHandler = async (req) => {
  try {
    const { payload } = req
    
    // 获取请求体中的数据
    const body = await req.json?.()
    const { email, password, username, invitationCode } = body || {}
    console.log('请求体数据:', { email, password, username, invitationCode })
    
    // 验证必需字段
    if (!email || !password || !username || !invitationCode) {
      return new Response(JSON.stringify({ error: '缺少必需字段' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    console.log('开始查找邀请码')
    // 查找邀请码
    const codes = await payload.find({
      collection: 'invitation-codes',
      where: {
        code: {
          equals: invitationCode,
        },
      },
      limit: 1,
    })
    
    if (codes.docs.length === 0) {
      return new Response(JSON.stringify({ error: '无效的邀请码' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const code = codes.docs[0]
    console.log('找到邀请码:', code)
    
    // 检查邀请码是否还有剩余使用次数
    if ((code.total_uses || 0) > 0 && (code.uses_left || 0) <= 0) {
      return new Response(JSON.stringify({ error: '邀请码已用完' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // 减少邀请码的剩余使用次数（如果不是无限制的）
    if ((code.total_uses || 0) > 0) {
      console.log('更新邀请码使用次数')
      await payload.update({
        collection: 'invitation-codes',
        id: code.id,
        data: {
          uses_left: Math.max(0, (code.uses_left || 0) - 1),
        },
      })
    }
    
    console.log('开始创建用户')
    // 创建用户
    const token = crypto.randomBytes(24).toString('hex')
    const exp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const user = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        username,
        group: code.group, // 将用户分配到邀请码指定的权限组
        email_verified: false,
        email_verification_token: token,
        email_verification_expiration: exp,
      },
    }) as User
    console.log('用户创建结果:', user)
    
    // 返回创建的用户信息（不包含敏感信息）
    const { password: _, ...userWithoutPassword } = user
    
    try {
      const base = getServerSideURL()
      const link = `${base}/email/confirm?t=${token}&uid=${user.id}`
      await payload.sendEmail?.({
        to: email,
        subject: '验证你的邮箱',
        html: `<p>欢迎加入 ChoirMem！</p><p>请点击链接验证你的邮箱：</p><p><a href="${link}">${link}</a></p>`,
      })
      await payload.update({ collection: 'users', id: user.id, data: { email_verification_last_sent: new Date().toISOString() } as any })
    } catch (e) {
      console.error('发送验证邮件失败:', e)
    }

    return new Response(JSON.stringify({ user: userWithoutPassword, message: '用户注册成功，请验证邮箱' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    
  } catch (error: any) {
    console.error('注册过程中发生错误:', error)
    
    // 检查是否是重复键错误（邮箱或用户名已存在）
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === 11000) {
      // 尝试确定是哪个字段重复
      if (error.message && error.message.includes('email')) {
        return new Response(JSON.stringify({ error: '邮箱已存在' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      } else if (error.message && error.message.includes('username')) {
        return new Response(JSON.stringify({ error: '用户名已存在' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      } else {
        return new Response(JSON.stringify({ error: '邮箱或用户名已存在' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
    
    // 返回更详细的错误信息
    return new Response(JSON.stringify({ error: `注册失败: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
