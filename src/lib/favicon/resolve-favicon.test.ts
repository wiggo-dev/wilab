import { describe, expect, it, vi } from 'vitest'
import {
  findIconHref,
  parseServiceUrl,
  resolveFavicon,
  resolveIconUrl,
} from './resolve-favicon'

describe('parseServiceUrl', () => {
  it('accepts http and https URLs', () => {
    expect(parseServiceUrl('http://nas.local/app')?.href).toBe('http://nas.local/app')
    expect(parseServiceUrl('https://nas.local')?.href).toBe('https://nas.local/')
  })

  it('rejects invalid URLs', () => {
    expect(parseServiceUrl('not-a-url')).toBeNull()
    expect(parseServiceUrl('ftp://nas.local')).toBeNull()
  })
})

describe('findIconHref', () => {
  it('prefers rel=icon over shortcut icon', () => {
    const html = `
      <link rel="shortcut icon" href="/shortcut.ico">
      <link rel="icon" href="/icon.svg">
    `
    expect(findIconHref(html)).toBe('/icon.svg')
  })

  it('falls back to shortcut icon', () => {
    const html = `<link rel="shortcut icon" href="/shortcut.ico">`
    expect(findIconHref(html)).toBe('/shortcut.ico')
  })

  it('ignores apple-touch-icon', () => {
    const html = `<link rel="apple-touch-icon" href="/apple.png">`
    expect(findIconHref(html)).toBeNull()
  })
})

describe('resolveIconUrl', () => {
  it('resolves relative hrefs against the page URL', () => {
    const page = new URL('http://nas.local:8080/app/')
    expect(resolveIconUrl(page, '/favicon.ico')).toBe('http://nas.local:8080/favicon.ico')
    expect(resolveIconUrl(page, 'data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
  })
})

describe('resolveFavicon', () => {
  const fetchMock = vi.fn()

  it('returns icon from page HTML', async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === 'HEAD') {
        return { ok: true }
      }
      if (url === 'http://nas.local/') {
        return {
          ok: true,
          text: async () => '<link rel="icon" href="/assets/icon.png">',
        }
      }
      return { ok: false, status: 404 }
    })

    const result = await resolveFavicon('http://nas.local/', fetchMock)
    expect(result).toEqual({ ok: true, logo: 'http://nas.local/assets/icon.png' })
  })

  it('falls back to /favicon.ico when HTML has no icon link', async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === 'HEAD') {
        return url.endsWith('/favicon.ico') ? { ok: true } : { ok: false, status: 404 }
      }
      return {
        ok: true,
        text: async () => '<html><body>Hello</body></html>',
      }
    })

    const result = await resolveFavicon('http://nas.local/dashboard', fetchMock)
    expect(result).toEqual({ ok: true, logo: 'http://nas.local/favicon.ico' })
  })

  it('returns an error when no favicon is available', async () => {
    fetchMock.mockImplementation(async () => ({ ok: false, status: 404 }))

    const result = await resolveFavicon('http://nas.local/', fetchMock)
    expect(result).toEqual({ ok: false, error: 'No favicon found for this URL.' })
  })
})
