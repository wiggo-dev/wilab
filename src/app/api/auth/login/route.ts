import { NextResponse } from 'next/server'
import { ACCESS_COOKIE, configuredAccessToken, tokensEqual } from '@/lib/access/token'

type LoginBody = {
  token?: unknown
}

export async function POST(request: Request) {
  const expected = configuredAccessToken()
  if (expected == null) {
    return NextResponse.json({ error: 'Access control is not enabled' }, { status: 400 })
  }

  let body: LoginBody
  try {
    body = (await request.json()) as LoginBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const provided = typeof body.token === 'string' ? body.token : ''
  if (!tokensEqual(provided, expected)) {
    return NextResponse.json({ error: 'Invalid access token' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  const secure = new URL(request.url).protocol === 'https:'
  response.cookies.set(ACCESS_COOKIE, expected, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return response
}
