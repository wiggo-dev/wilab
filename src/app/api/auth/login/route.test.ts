import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ACCESS_COOKIE, ACCESS_ENV, deriveSessionCookie } from '@/lib/access/token'

describe('/api/auth/login', () => {
  const previous = process.env[ACCESS_ENV]

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    if (previous === undefined) {
      delete process.env[ACCESS_ENV]
    } else {
      process.env[ACCESS_ENV] = previous
    }
    vi.resetModules()
  })

  it('rejects login when access control is disabled', async () => {
    delete process.env[ACCESS_ENV]
    const { POST } = await import('./route')
    const response = await POST(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'anything' }),
      }),
    )
    expect(response.status).toBe(400)
  })

  it('sets an httpOnly derived session cookie for a matching token', async () => {
    process.env[ACCESS_ENV] = 'lab-secret'
    const expectedSession = await deriveSessionCookie('lab-secret')
    const { POST } = await import('./route')
    const response = await POST(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'lab-secret' }),
      }),
    )

    expect(response.status).toBe(200)
    const cookie = response.headers.get('set-cookie') ?? ''
    expect(cookie).toContain(`${ACCESS_COOKIE}=${expectedSession}`)
    expect(cookie).not.toContain('lab-secret')
    expect(cookie.toLowerCase()).toContain('httponly')
  })

  it('sets Secure when X-Forwarded-Proto is https', async () => {
    process.env[ACCESS_ENV] = 'lab-secret'
    const { POST } = await import('./route')
    const response = await POST(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-Proto': 'https',
        },
        body: JSON.stringify({ token: 'lab-secret' }),
      }),
    )

    expect(response.status).toBe(200)
    expect((response.headers.get('set-cookie') ?? '').toLowerCase()).toContain('secure')
  })

  it('rejects a wrong token', async () => {
    process.env[ACCESS_ENV] = 'lab-secret'
    const { POST } = await import('./route')
    const response = await POST(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'nope' }),
      }),
    )
    expect(response.status).toBe(401)
  })
})
