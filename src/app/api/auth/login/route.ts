import { NextResponse } from 'next/server'
import {
  ACCESS_COOKIE,
  accessCookieOptions,
  configuredAccessToken,
  deriveSessionCookie,
  requestIsSecure,
  tokensEqual,
} from '@/lib/access/token'

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

  const session = await deriveSessionCookie(expected)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(
    ACCESS_COOKIE,
    session,
    accessCookieOptions(requestIsSecure(request), 60 * 60 * 24 * 365),
  )
  return response
}
