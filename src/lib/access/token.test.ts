import { describe, expect, it } from 'vitest'
import {
  ACCESS_ENV,
  configuredAccessToken,
  isAuthorized,
  isPublicPath,
  readBearerToken,
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

  it('allows all requests when no token is configured', () => {
    expect(
      isAuthorized({
        expectedToken: null,
        cookieToken: null,
        authorization: null,
      }),
    ).toBe(true)
  })

  it('accepts a matching cookie or Bearer token', () => {
    expect(
      isAuthorized({
        expectedToken: 's3cret',
        cookieToken: 's3cret',
        authorization: null,
      }),
    ).toBe(true)
    expect(
      isAuthorized({
        expectedToken: 's3cret',
        cookieToken: null,
        authorization: 'Bearer s3cret',
      }),
    ).toBe(true)
  })

  it('rejects missing or wrong credentials when configured', () => {
    expect(
      isAuthorized({
        expectedToken: 's3cret',
        cookieToken: null,
        authorization: null,
      }),
    ).toBe(false)
    expect(
      isAuthorized({
        expectedToken: 's3cret',
        cookieToken: 'wrong',
        authorization: 'Bearer wrong',
      }),
    ).toBe(false)
  })

  it('exposes login, health, and static paths as public', () => {
    expect(isPublicPath('/api/health')).toBe(true)
    expect(isPublicPath('/login')).toBe(true)
    expect(isPublicPath('/api/auth/login')).toBe(true)
    expect(isPublicPath('/sw.js')).toBe(true)
    expect(isPublicPath('/manifest.webmanifest')).toBe(true)
    expect(isPublicPath('/icons/icon-192.png')).toBe(true)
    expect(isPublicPath('/catalog/icons/sonarr.svg')).toBe(true)
    expect(isPublicPath('/_next/static/chunk.js')).toBe(true)
    expect(isPublicPath('/')).toBe(false)
    expect(isPublicPath('/api/config')).toBe(false)
    expect(isPublicPath('/api/live')).toBe(false)
  })
})
