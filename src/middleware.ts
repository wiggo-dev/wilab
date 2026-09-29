import { NextResponse, type NextRequest } from 'next/server'
import {
  ACCESS_COOKIE,
  configuredAccessToken,
  isAuthorized,
  isPublicPath,
} from '@/lib/access/token'

export function middleware(request: NextRequest) {
  const expectedToken = configuredAccessToken()
  if (expectedToken == null) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const authorized = isAuthorized({
    expectedToken,
    cookieToken: request.cookies.get(ACCESS_COOKIE)?.value,
    authorization: request.headers.get('authorization'),
  })

  if (authorized) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const login = new URL('/login', request.url)
  const next = `${pathname}${request.nextUrl.search}`
  if (next && next !== '/') {
    login.searchParams.set('next', next)
  }
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
