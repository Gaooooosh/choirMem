import type { PayloadHandler } from 'payload'
import type { User } from '@/payload-types'

import { APIError } from 'payload'

export const register: PayloadHandler = async ({ req, res }) => {
  const { payload } = req
  
  // 获取请求体中的数据
  const { email, password, username, invitationCode } = await req.json()
  console.log('请求体数据:', { email, password, username, invitationCode })
  
  // 验证必需字段
  if (!email || !password || !username || !invitationCode) {
    throw new APIError('缺少必需字段', 400)
  }
  
  try {
    console.log('开始查找邀请码')
    // 查找邀请码并原子性地减少使用次数
    // 使用 update 操作来同时检查和更新邀请码，避免竞态条件
    const invitationCodeUpdate = await payload.update({
      collection: 'invitation-codes',
      where: {
        and: [
          {
            code: {
              equals: invitationCode,
            },
          },
          {
            or: [
              {
                uses_left: {
                  greater_than: 0,
                },
              },
              {
                total_uses: {
                  equals: 0,
                },
              },
            ],
          },
        ],
      },
      data: {
        // 只有当 uses_left > 0 时才减少，对于无限制邀请码(total_uses=0)不修改
        uses_left: {
          decrement: 1,
        },
      },
      // 只更新一个文档
      limit: 1,
    })
    
    console.log('邀请码更新结果:', invitationCodeUpdate)
    
    // 检查邀请码是否有效
    if (!invitationCodeUpdate || invitationCodeUpdate.docs.length === 0) {
      throw new APIError('无效的邀请码或邀请码已用完', 400)
    }
    
    const code = invitationCodeUpdate.docs[0]
    console.log('找到的邀请码:', code)
    
    // 创建用户
    console.log('开始创建用户')
    const user = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        username,
        group: code.group, // 将用户分配到邀请码指定的权限组
      },
    }) as User
    console.log('用户创建结果:', user)
    
    // 返回创建的用户信息（不包含敏感信息）
    const { password: _, ...userWithoutPassword } = user
    
    res.status(200).json({
      user: userWithoutPassword,
      message: '用户注册成功',
    })
  } catch (error: any) {
    console.error('注册过程中发生错误:', error)
    if (error instanceof APIError) {
      throw error
    }
    
    // 检查是否是重复键错误（邮箱或用户名已存在）
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === 11000) {
      // 尝试确定是哪个字段重复
      if (error.message && error.message.includes('email')) {
        throw new APIError('邮箱已存在', 400)
      } else if (error.message && error.message.includes('username')) {
        throw new APIError('用户名已存在', 400)
      } else {
        throw new APIError('邮箱或用户名已存在', 400)
      }
    }
    
    // 返回更详细的错误信息
    throw new APIError(`注册失败: ${error.message}`, 500)
  }
}