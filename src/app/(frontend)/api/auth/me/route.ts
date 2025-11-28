import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config })
  const csrfCookie = request.cookies.get('payload-token')?.value || request.headers.get('cookie')?.split(';').find((c)=>c.trim().startsWith('payload-token='))?.split('=')[1]
  if (!csrfCookie) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return NextResponse.json({ error: '未授权' }, { status: 401 })
  return NextResponse.json({ user })
}

