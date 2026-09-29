import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ACCESS_COOKIE, ACCESS_ENV, deriveSessionCookie } from '@/lib/access/token'

describe('middleware', () => {
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

  it('passes through when access control is disabled', async () => {
    delete process.env[ACCESS_ENV]
    const { middleware } = await import('./middleware')
    const response = await middleware(new NextRequest('http://localhost/api/config'))
    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  it('returns 401 for unauthenticated API requests', async () => {
    process.env[ACCESS_ENV] = 'lab-secret'
    const { middleware } = await import('./middleware')
    const response = await middleware(new NextRequest('http://localhost/api/config'))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  it('redirects unauthenticated page requests to /login with a next param', async () => {
    process.env[ACCESS_ENV] = 'lab-secret'
    const { middleware } = await import('./middleware')
    const response = await middleware(new NextRequest('http://localhost/foo?bar=1'))
    expect(response.status).toBeGreaterThanOrEqual(300)
    expect(response.status).toBeLessThan(400)
    const location = new URL(response.headers.get('location')!, 'http://localhost')
    expect(location.pathname).toBe('/login')
    expect(location.searchParams.get('next')).toBe('/foo?bar=1')
  })

  it('allows Bearer and derived session cookie', async () => {
    process.env[ACCESS_ENV] = 'lab-secret'
    const session = await deriveSessionCookie('lab-secret')
    const { middleware } = await import('./middleware')

    const bearer = await middleware(
      new NextRequest('http://localhost/api/live', {
        headers: { authorization: 'Bearer lab-secret' },
      }),
    )
    expect(bearer.status).toBe(200)

    const cookie = await middleware(
      new NextRequest('http://localhost/', {
        headers: { cookie: `${ACCESS_COOKIE}=${session}` },
      }),
    )
    expect(cookie.status).toBe(200)
    expect(cookie.headers.get('location')).toBeNull()
  })

  it('allows health and login without credentials', async () => {
    process.env[ACCESS_ENV] = 'lab-secret'
    const { middleware } = await import('./middleware')

    expect((await middleware(new NextRequest('http://localhost/api/health'))).status).toBe(200)
    expect((await middleware(new NextRequest('http://localhost/login'))).status).toBe(200)
    expect((await middleware(new NextRequest('http://localhost/icon.svg'))).status).toBe(200)
  })
})
