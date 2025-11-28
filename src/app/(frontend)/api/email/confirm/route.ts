import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const url = new URL(req.url)
  const token = url.searchParams.get('t') || ''
  const uid = url.searchParams.get('uid') || ''

  if (!token || !uid) {
    return NextResponse.json({ message: '参数缺失' }, { status: 400 })
  }

  const user = await payload.findByID({ collection: 'users', id: Number(uid), overrideAccess: true }).catch(() => null)
  if (!user) return NextResponse.json({ message: '用户不存在' }, { status: 404 })

  const pendingToken = (user as any).pending_email_verification_token
  const pendingExp = (user as any).pending_email_verification_expiration
  const emailToken = (user as any).email_verification_token
  const emailExp = (user as any).email_verification_expiration

  const now = Date.now()
  const matchPending = pendingToken && pendingToken === token && pendingExp && new Date(pendingExp).getTime() > now
  const matchPrimary = emailToken && emailToken === token && emailExp && new Date(emailExp).getTime() > now

  if (!matchPending && !matchPrimary) {
    return NextResponse.json({ message: '令牌无效或已过期' }, { status: 400 })
  }

  if (matchPending) {
    const nextEmail = (user as any).pending_email
    const updated = await payload.update({
      collection: 'users',
      id: (user as any).id,
      data: {
        email: nextEmail,
        email_verified: true,
        pending_email: null,
        pending_email_verification_token: null,
        pending_email_verification_expiration: null,
      },
      overrideAccess: true,
    })
    return NextResponse.json({ message: '邮箱已更新并验证', user: updated })
  }

  const updated = await payload.update({
    collection: 'users',
    id: (user as any).id,
    data: {
      email_verified: true,
      email_verification_token: null,
      email_verification_expiration: null,
    },
    overrideAccess: true,
  })
  return NextResponse.json({ message: '邮箱已验证', user: updated })
}

