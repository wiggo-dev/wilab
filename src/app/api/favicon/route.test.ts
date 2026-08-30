import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('/api/favicon', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('returns a resolved favicon URL', async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === 'HEAD') {
        return { ok: true }
      }
      return {
        ok: true,
        text: async () => '<link rel="icon" href="/favicon.ico">',
      }
    })

    const { POST } = await import('./route')
    const response = await POST(
      new Request('http://localhost/api/favicon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'http://printer.local' }),
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true, logo: 'http://printer.local/favicon.ico' })
  })

  it('returns 400 when url is missing', async () => {
    const { POST } = await import('./route')
    const response = await POST(
      new Request('http://localhost/api/favicon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(400)
  })

  it('returns failure without throwing when favicon lookup fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 })

    const { POST } = await import('./route')
    const response = await POST(
      new Request('http://localhost/api/favicon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'http://missing.local' }),
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(false)
  })
})
