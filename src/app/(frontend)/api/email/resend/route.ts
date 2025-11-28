import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })
  const csrfHeader = request.headers.get('x-csrf-token')
  const csrfCookie = request.cookies.get('csrf-token')?.value || request.headers.get('cookie')?.split(';').find((c)=>c.trim().startsWith('csrf-token='))?.split('=')[1]
  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    return NextResponse.json({ message: '无效的CSRF令牌' }, { status: 403 })
  }

  let email: string | undefined
  let uid: string | undefined
  try {
    const body = await request.json()
    email = body?.email
    uid = body?.uid
  } catch {}

  const base = (await import('@/utilities/getURL')).getServerSideURL()

  const now = Date.now()
  if (email) {
    const res = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, overrideAccess: true })
    const user = res.docs[0] as any
    if (!user) return NextResponse.json({ message: '如该邮箱存在，将会收到验证邮件' })
    if (user.email_verified) return NextResponse.json({ message: '邮箱已验证' })
    const last = user.email_verification_last_sent ? new Date(user.email_verification_last_sent).getTime() : 0
    if (last && now - last < 60_000) {
      return NextResponse.json({ message: '请稍后再试（需间隔60秒）' }, { status: 429 })
    }
    const token = crypto.randomBytes(24).toString('hex')
    const exp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await payload.update({ collection: 'users', id: user.id, data: { email_verification_token: token, email_verification_expiration: exp }, overrideAccess: true })
    const link = `${base}/email/confirm?t=${token}&uid=${user.id}`
    await payload.sendEmail?.({ to: String(email), subject: '重新发送邮箱验证', html: `<p>请点击链接完成邮箱验证：</p><p><a href="${link}">${link}</a></p>` })
    await payload.update({ collection: 'users', id: user.id, data: { email_verification_last_sent: new Date().toISOString() } as any, overrideAccess: true })
    return NextResponse.json({ message: '验证邮件已发送' })
  }

  if (uid) {
    const user = await payload.findByID({ collection: 'users', id: Number(uid), overrideAccess: true }).catch(() => null) as any
    if (!user) return NextResponse.json({ message: '如账户存在，将会收到验证邮件' })
    if (user.pending_email) {
      const lastPending = user.pending_email_verification_last_sent ? new Date(user.pending_email_verification_last_sent).getTime() : 0
      if (lastPending && now - lastPending < 60_000) {
        return NextResponse.json({ message: '请稍后再试（需间隔60秒）' }, { status: 429 })
      }
      const token = crypto.randomBytes(24).toString('hex')
      const exp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      await payload.update({ collection: 'users', id: user.id, data: { pending_email_verification_token: token, pending_email_verification_expiration: exp }, overrideAccess: true })
      const link = `${base}/email/confirm?t=${token}&uid=${user.id}`
      await payload.sendEmail?.({ to: String(user.pending_email), subject: '重新发送新邮箱验证', html: `<p>请点击链接验证你的新邮箱：</p><p><a href="${link}">${link}</a></p>` })
      await payload.update({ collection: 'users', id: user.id, data: { pending_email_verification_last_sent: new Date().toISOString() } as any, overrideAccess: true })
      return NextResponse.json({ message: '新邮箱验证邮件已发送' })
    }
    if (!user.email_verified) {
      const token = crypto.randomBytes(24).toString('hex')
      const exp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      await payload.update({ collection: 'users', id: user.id, data: { email_verification_token: token, email_verification_expiration: exp }, overrideAccess: true })
      const link = `${base}/api/email/confirm?t=${token}&uid=${user.id}`
      await payload.sendEmail?.({ to: String(user.email), subject: '重新发送邮箱验证', html: `<p>请点击链接完成邮箱验证：</p><p><a href="${link}">${link}</a></p>` })
      return NextResponse.json({ message: '验证邮件已发送' })
    }
    return NextResponse.json({ message: '邮箱已验证' })
  }

  return NextResponse.json({ message: '缺少参数' }, { status: 400 })
}
