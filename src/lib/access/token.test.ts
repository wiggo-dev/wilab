import { describe, expect, it } from 'vitest'
import {
  ACCESS_ENV,
  configuredAccessToken,
  deriveSessionCookie,
  isAuthorized,
  isPublicPath,
  readBearerToken,
  safeNextPath,
  tokensEqual,
} from './token'

describe('access token', () => {
  it('compares tokens in constant time', () => {
    expect(tokensEqual('secret', 'secret')).toBe(true)
    expect(tokensEqual('secret', 'Secret')).toBe(false)
    expect(tokensEqual('short', 'longer')).toBe(false)
    expect(tokensEqual(null, 'secret')).toBe(false)
    expect(tokensEqual(undefined, 'secret')).toBe(false)
  })

  it('parses Bearer authorization headers', () => {
    expect(readBearerToken('Bearer abc')).toBe('abc')
    expect(readBearerToken('bearer  abc  ')).toBe('abc')
    expect(readBearerToken('Basic abc')).toBeNull()
    expect(readBearerToken(null)).toBeNull()
  })

  it('treats unset or blank WILAB_ACCESS_TOKEN as disabled', () => {
    expect(configuredAccessToken({})).toBeNull()
    expect(configuredAccessToken({ [ACCESS_ENV]: '' })).toBeNull()
    expect(configuredAccessToken({ [ACCESS_ENV]: '   ' })).toBeNull()
    expect(configuredAccessToken({ [ACCESS_ENV]: ' s3cret ' })).toBe('s3cret')
  })

  it('allows all requests when no token is configured', async () => {
    expect(
      await isAuthorized({
        expectedToken: null,
        cookieValue: null,
        authorization: null,
      }),
    ).toBe(true)
  })

  it('accepts a derived session cookie or Bearer token', async () => {
    const cookie = await deriveSessionCookie('s3cret')
    expect(cookie).not.toBe('s3cret')
    expect(cookie).toMatch(/^[0-9a-f]{64}$/)

    expect(
      await isAuthorized({
        expectedToken: 's3cret',
        cookieValue: cookie,
        authorization: null,
      }),
    ).toBe(true)
    expect(
      await isAuthorized({
        expectedToken: 's3cret',
        cookieValue: null,
        authorization: 'Bearer s3cret',
      }),
    ).toBe(true)
    expect(
      await isAuthorized({
        expectedToken: 's3cret',
        cookieValue: 's3cret',
        authorization: null,
      }),
    ).toBe(false)
  })

  it('rejects missing or wrong credentials when configured', async () => {
    expect(
      await isAuthorized({
        expectedToken: 's3cret',
        cookieValue: null,
        authorization: null,
      }),
    ).toBe(false)
    expect(
      await isAuthorized({
        expectedToken: 's3cret',
        cookieValue: 'wrong',
        authorization: 'Bearer wrong',
      }),
    ).toBe(false)
  })

  it('exposes login, health, icons, and static paths as public', () => {
    expect(isPublicPath('/api/health')).toBe(true)
    expect(isPublicPath('/login')).toBe(true)
    expect(isPublicPath('/api/auth/login')).toBe(true)
    expect(isPublicPath('/sw.js')).toBe(true)
    expect(isPublicPath('/manifest.webmanifest')).toBe(true)
    expect(isPublicPath('/icon.svg')).toBe(true)
    expect(isPublicPath('/favicon.ico')).toBe(true)
    expect(isPublicPath('/icons/icon-192.png')).toBe(true)
    expect(isPublicPath('/catalog/icons/sonarr.svg')).toBe(true)
    expect(isPublicPath('/_next/static/chunk.js')).toBe(true)
    expect(isPublicPath('/')).toBe(false)
    expect(isPublicPath('/api/config')).toBe(false)
    expect(isPublicPath('/api/live')).toBe(false)
  })

  it('only allows same-origin relative next paths', () => {
    const origin = 'http://localhost:3000'
    expect(safeNextPath(null, origin)).toBe('/')
    expect(safeNextPath('/edit', origin)).toBe('/edit')
    expect(safeNextPath('/path?x=1#h', origin)).toBe('/path?x=1#h')
    expect(safeNextPath('//evil.com', origin)).toBe('/')
    expect(safeNextPath('/\\evil.com', origin)).toBe('/')
    expect(safeNextPath('https://evil.com/', origin)).toBe('/')
    expect(safeNextPath('http://evil.com/phish', origin)).toBe('/')
  })
})
