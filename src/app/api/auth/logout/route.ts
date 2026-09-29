import { NextResponse } from 'next/server'
import { ACCESS_COOKIE } from '@/lib/access/token'

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true })
  const secure = new URL(request.url).protocol === 'https:'
  response.cookies.set(ACCESS_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 0,
  })
  return response
}
