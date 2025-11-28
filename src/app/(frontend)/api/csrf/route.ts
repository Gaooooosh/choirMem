import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const token = crypto.randomUUID()
  const isSecure = req.nextUrl.protocol === 'https:'
  const res = NextResponse.json({ token })
  res.cookies.set('csrf-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    path: '/',
  })
  return res
}
