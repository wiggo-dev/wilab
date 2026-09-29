export const ACCESS_COOKIE = 'wilab_access_token'
export const ACCESS_ENV = 'WILAB_ACCESS_TOKEN'

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

export function isAuthorized(input: {
  expectedToken: string | null
  cookieToken?: string | null
  authorization?: string | null
}): boolean {
  if (input.expectedToken == null) return true
  if (tokensEqual(input.cookieToken, input.expectedToken)) return true
  return tokensEqual(readBearerToken(input.authorization ?? null), input.expectedToken)
}

export function isPublicPath(pathname: string): boolean {
  if (pathname === '/api/health') return true
  if (pathname === '/login') return true
  if (pathname === '/api/auth/login') return true
  if (pathname === '/sw.js') return true
  if (pathname === '/manifest.webmanifest') return true
  if (pathname.startsWith('/icons/')) return true
  if (pathname.startsWith('/catalog/')) return true
  if (pathname.startsWith('/_next/')) return true
  return false
}
