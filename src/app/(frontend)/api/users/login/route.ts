import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

function generateHOTP(secret: string, counter: number): string {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  const hmac = crypto.createHmac('sha1', Buffer.from(secret))
  hmac.update(buf)
  const digest = hmac.digest()
  const offset = digest[digest.length - 1] & 0xf
  const code = ((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0')
  return code
}

function verifyTOTP(secret: string, codeToVerify: string, window = 1, step = 30): boolean {
  const epoch = Math.floor(Date.now() / 1000)
  const counter = Math.floor(epoch / step)
  for (let w = -window; w <= window; w++) {
    const code = generateHOTP(secret, counter + w)
    if (code === codeToVerify) return true
  }
  return false
}

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })
  const csrfHeader = request.headers.get('x-csrf-token')
  const csrfCookie = request.cookies.get('csrf-token')?.value || request.headers.get('cookie')?.split(';').find((c)=>c.trim().startsWith('csrf-token='))?.split('=')[1]
  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    return NextResponse.json({ message: '无效的CSRF令牌' }, { status: 403 })
  }

  let email: string | undefined
  let password: string | undefined
  let mfaCode: string | undefined
  try {
    const body = await request.json()
    email = body?.email
    password = body?.password
    mfaCode = body?.mfaCode
  } catch {
    // 非JSON内容兜底
  }
  if (!email || !password) {
    return NextResponse.json({ message: '邮箱与密码必填' }, { status: 400 })
  }

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })
  const userDoc = existing.docs[0]
  const locked = (userDoc as any)?.locked_until || (userDoc as any)?.lockUntil
  if (locked && new Date(locked).getTime() > Date.now()) {
    return NextResponse.json({ message: '账户暂时锁定，请稍后再试' }, { status: 423 })
  }

  try {
    const result = await payload.login({ collection: 'users', data: { email, password } })
    const user = result.user as any
    if (!user.email_verified && !(user.needs_password_reset === true)) {
      return NextResponse.json({ message: '邮箱未验证，请先完成邮箱验证' }, { status: 403 })
    }
    if (user.mfa_enabled) {
      const ok = user.mfa_secret
        ? verifyTOTP(String(user.mfa_secret), String(mfaCode || ''))
        : false
      if (!ok) {
        await payload.update({
          collection: 'users',
          id: user.id,
          data: {
            login_attempts: (user.login_attempts || 0) + 1,
          },
        })
        return NextResponse.json({ message: 'MFA 验证失败' }, { status: 401 })
      }
    }

    await payload.update({
      collection: 'users',
      id: user.id,
      data: { login_attempts: 0, locked_until: null },
    })

    const isSecure = request.nextUrl.protocol === 'https:'
    const res = NextResponse.json({ user })
    res.cookies.set('payload-token', String(result.token || ''), {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      path: '/',
    })
    return res
  } catch (e) {
    if (userDoc) {
      const attempts = ((userDoc as any).login_attempts || 0) + 1
      const currentLock = (userDoc as any).locked_until || (userDoc as any).lockUntil
      const lock = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : currentLock
      await payload.update({
        collection: 'users',
        id: userDoc.id,
        data: { login_attempts: attempts, locked_until: lock },
      })
    }
    return NextResponse.json({ message: '登录失败，请检查邮箱与密码' }, { status: 401 })
  }
}
