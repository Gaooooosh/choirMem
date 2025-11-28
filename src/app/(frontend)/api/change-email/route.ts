import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })

  const csrfHeader = request.headers.get('x-csrf-token')
  const csrfCookie = request.cookies.get('csrf-token')?.value || request.headers.get('cookie')?.split(';').find((c)=>c.trim().startsWith('csrf-token='))?.split('=')[1]
  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    return NextResponse.json({ error: '无效的CSRF令牌' }, { status: 403 })
  }

  let newEmail: string | undefined
  try {
    const body = await request.json()
    newEmail = body?.email
  } catch {}
  if (!newEmail) return NextResponse.json({ error: '缺少邮箱' }, { status: 400 })

  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return NextResponse.json({ error: '未授权' }, { status: 401 })

  const token = crypto.randomBytes(24).toString('hex')
  const exp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const updated = await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      pending_email: newEmail,
      pending_email_verification_token: token,
      pending_email_verification_expiration: exp,
    },
    overrideAccess: true,
  })

  const base = (await import('@/utilities/getURL')).getServerSideURL()
  const link = `${base}/api/email/confirm?t=${token}&uid=${user.id}`
  await payload.sendEmail?.({
    to: String(newEmail),
    subject: '验证你的新邮箱',
    html: `<p>请点击链接验证你的新邮箱：</p><p><a href="${link}">${link}</a></p>`,
  })

  return NextResponse.json({ message: '已发送验证邮件，请前往新邮箱完成验证', user: updated })
}

