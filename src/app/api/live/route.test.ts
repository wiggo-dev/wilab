import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetLiveState } from '@/lib/integrations/live'

describe('/api/live', () => {
  let dataDir: string
  const previousDataDir = process.env.WILAB_DATA_DIR
  const fetchMock = vi.fn()

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'wilab-api-live-'))
    process.env.WILAB_DATA_DIR = dataDir
    resetLiveState()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.resetModules()
  })

  afterEach(async () => {
    if (previousDataDir === undefined) {
      delete process.env.WILAB_DATA_DIR
    } else {
      process.env.WILAB_DATA_DIR = previousDataDir
    }
    await rm(dataDir, { recursive: true, force: true })
    resetLiveState()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('returns per-service glances without failing the whole board', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('good-kuma')) {
        return {
          ok: true,
          text: async () => 'monitor_status{monitor_id="1"} 1\nmonitor_status{monitor_id="2"} 1\n',
        }
      }
      return { ok: false, status: 500, text: async () => '' }
    })

    const { PUT } = await import('../config/route')
    const { GET } = await import('./route')

    await PUT(
      new Request('http://localhost/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemaVersion: 1,
          services: [
            {
              id: 'good',
              catalogId: 'uptime-kuma',
              name: 'Good Kuma',
              url: 'http://good-kuma:3001',
              logo: '',
              tags: [],
              integration: { kind: 'uptime-kuma', apiKey: 'uk1_a' },
            },
            {
              id: 'bad',
              catalogId: 'uptime-kuma',
              name: 'Bad Kuma',
              url: 'http://bad-kuma:3001',
              logo: '',
              tags: [],
              integration: { kind: 'uptime-kuma', apiKey: 'uk1_b' },
            },
          ],
          gridOrder: ['good', 'bad'],
          pinnedOrder: [],
          searchProviders: [],
          activeSearchProviderId: 'ddg',
        }),
      }),
    )

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.services.good).toEqual({ status: 'healthy', text: '2/2 up' })
    expect(body.services.bad).toEqual({ status: 'unavailable', text: 'Unavailable' })
  })
})
