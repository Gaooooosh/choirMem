import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl

  if (pathname.startsWith('/_next')) return NextResponse.next()
  if (pathname === '/favicon.ico' || pathname === '/favicon.svg') return NextResponse.next()
  if (pathname.startsWith('/media/')) return NextResponse.next()
  if (pathname.startsWith('/scores/')) return NextResponse.next()
  if (pathname.startsWith('/api/')) return NextResponse.next()

  const token = req.cookies.get('payload-token')?.value

  if (token) {
    try {
      const me = await fetch(`${origin}/api/users/me`, {
        headers: { Authorization: `JWT ${token}` },
      })
      if (me.ok) {
        const data = await me.json()
        const user = data?.user
        const needsMigration = Boolean(user?.needs_password_reset) || Boolean(user?.email && String(user.email).includes('@example.com'))
        if (needsMigration && pathname !== '/migration-help' && pathname !== '/force-update-profile') {
          const url = req.nextUrl.clone()
          url.pathname = '/migration-help'
          return NextResponse.redirect(url)
        }
      }
    } catch {}
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|favicon.svg|media/|scores/).*)'],
}
