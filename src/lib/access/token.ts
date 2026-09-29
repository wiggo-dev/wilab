export const ACCESS_COOKIE = 'wilab_access_token'
export const ACCESS_ENV = 'WILAB_ACCESS_TOKEN'
const SESSION_MESSAGE = 'wilab-session'

/** Constant-time string compare for shared secrets (Edge-safe). */
export function tokensEqual(provided: string | null | undefined, expected: string): boolean {
  if (provided == null || provided.length !== expected.length) return false
  let mismatch = 0
  for (let i = 0; i < expected.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return mismatch === 0
}

export function readBearerToken(authorization: string | null): string | null {
  if (!authorization) return null
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim())
  return match?.[1]?.trim() || null
}

export function configuredAccessToken(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string | null {
  const raw = env[ACCESS_ENV]
  if (raw == null) return null
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : null
}

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** HMAC-SHA256(token, "wilab-session") — cookie holds this, never the raw secret. */
export async function deriveSessionCookie(token: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(token),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(SESSION_MESSAGE),
  )
  return bytesToHex(signature)
}

export async function isAuthorized(input: {
  expectedToken: string | null
  cookieValue?: string | null
  authorization?: string | null
}): Promise<boolean> {
  if (input.expectedToken == null) return true
  const expectedCookie = await deriveSessionCookie(input.expectedToken)
  if (tokensEqual(input.cookieValue, expectedCookie)) return true
  return tokensEqual(readBearerToken(input.authorization ?? null), input.expectedToken)
}

/**
 * Only allow same-origin relative paths. Rejects protocol-relative (`//evil.com`)
 * and backslash tricks (`/\\evil.com`) that `startsWith('/')` would accept.
 */
export function safeNextPath(next: string | null | undefined, baseOrigin: string): string {
  if (!next) return '/'
  try {
    const base = new URL(baseOrigin)
    const url = new URL(next, base)
    if (url.origin !== base.origin) return '/'
    const path = `${url.pathname}${url.search}${url.hash}`
    return path.startsWith('/') ? path : '/'
  } catch {
    return '/'
  }
}

export function requestIsSecure(request: Request): boolean {
  if (new URL(request.url).protocol === 'https:') return true
  const forwarded = request.headers.get('x-forwarded-proto')
  return forwarded?.split(',')[0]?.trim().toLowerCase() === 'https'
}

export function accessCookieOptions(secure: boolean, maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge,
  }
}

export function isPublicPath(pathname: string): boolean {
  if (pathname === '/api/health') return true
  if (pathname === '/login') return true
  if (pathname === '/api/auth/login') return true
  if (pathname === '/sw.js') return true
  if (pathname === '/manifest.webmanifest') return true
  if (pathname === '/icon.svg' || pathname === '/favicon.ico') return true
  if (pathname.startsWith('/icons/')) return true
  if (pathname.startsWith('/catalog/')) return true
  if (pathname.startsWith('/_next/')) return true
  return false
}
