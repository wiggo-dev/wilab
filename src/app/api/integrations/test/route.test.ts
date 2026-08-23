import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('/api/integrations/test', () => {
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

  it('returns success with glance text when upstream responds', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => 'monitor_status{monitor_id="1"} 1\n',
    })

    const { POST } = await import('./route')
    const response = await POST(
      new Request('http://localhost/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'http://kuma.lab:3001',
          integration: { kind: 'uptime-kuma', apiKey: 'uk1_test' },
        }),
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true, text: '1/1 up' })
  })

  it('returns failure without throwing when upstream rejects', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, text: async () => '' })

    const { POST } = await import('./route')
    const response = await POST(
      new Request('http://localhost/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'http://kuma.lab:3001',
          integration: { kind: 'uptime-kuma', apiKey: 'bad' },
        }),
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(false)
    expect(body.error).toContain('401')
  })

  it('validates request body', async () => {
    const { POST } = await import('./route')
    const response = await POST(
      new Request('http://localhost/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'http://example.com' }),
      }),
    )

    expect(response.status).toBe(400)
  })
})
