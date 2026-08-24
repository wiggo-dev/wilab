import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { WilabConfig } from '@/lib/config/types'
import { GlanceEngine } from './glance-engine'
import { LIVE_COALESCE_MS, STALE_THRESHOLD_MS } from './types'

const baseConfig: WilabConfig = {
  schemaVersion: 1,
  services: [
    {
      id: 'svc-kuma',
      catalogId: 'uptime-kuma',
      name: 'Uptime Kuma',
      url: 'http://kuma.lab:3001',
      logo: '',
      tags: ['infra'],
      integration: { kind: 'uptime-kuma', apiKey: 'uk1_test' },
    },
    {
      id: 'svc-broken',
      catalogId: 'uptime-kuma',
      name: 'Broken Kuma',
      url: 'http://broken.lab:3001',
      logo: '',
      tags: ['infra'],
      integration: { kind: 'uptime-kuma', apiKey: 'bad' },
    },
  ],
  gridOrder: ['svc-kuma', 'svc-broken'],
  pinnedOrder: [],
  searchProviders: [],
  activeSearchProviderId: 'ddg',
}

describe('GlanceEngine', () => {
  const fetchMock = vi.fn()
  let now = 0

  beforeEach(() => {
    fetchMock.mockReset()
    now = 0
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function engine() {
    return new GlanceEngine({ fetch: fetchMock, now: () => now })
  }

  it('returns per-service results and isolates upstream failures', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('kuma.lab')) {
        return {
          ok: true,
          text: async () => 'monitor_status{monitor_id="1"} 1\nmonitor_status{monitor_id="2"} 0\n',
        }
      }
      return { ok: false, status: 500, text: async () => '' }
    })

    now = 1_000
    const response = await engine().aggregate(baseConfig)

    expect(response.services['svc-kuma']).toEqual({ status: 'healthy', text: '1/2 up' })
    expect(response.services['svc-broken']).toEqual({ status: 'unavailable', text: 'Unavailable' })
  })

  it('coalesces repeated live requests within 30 seconds', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => 'monitor_status{monitor_id="1"} 1\n',
    })

    const glances = engine()
    now = 10_000
    await glances.get(baseConfig)
    now = 10_000 + LIVE_COALESCE_MS - 1
    await glances.get(baseConfig)

    // One upstream call per integrated service on the first get; second get is coalesced.
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('re-polls when integrated services or credentials change', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => 'monitor_status{monitor_id="1"} 1\n',
    })

    const glances = engine()
    now = 10_000
    await glances.get(baseConfig)

    const withHttpHealth: WilabConfig = {
      ...baseConfig,
      services: [
        ...baseConfig.services,
        {
          id: 'svc-jellyfin',
          catalogId: 'jellyfin',
          name: 'Jellyfin',
          url: 'http://jellyfin.lab:8096',
          logo: '',
          tags: [],
          integration: { kind: 'http-health', path: '' },
        },
      ],
    }

    now = 10_000 + 1_000
    await glances.get(withHttpHealth)

    expect(fetchMock.mock.calls.length).toBeGreaterThan(2)
  })

  it('marks previously healthy glances stale after 90 seconds', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => 'monitor_status{monitor_id="1"} 1\n',
    })

    const glances = engine()
    now = 0
    await glances.get(baseConfig)
    fetchMock.mockRejectedValue(new Error('down'))

    now = STALE_THRESHOLD_MS + 1_000
    const aged = await glances.get(baseConfig)

    expect(aged.services['svc-kuma'].status).toBe('stale')
    expect(aged.services['svc-kuma'].text).toBe('1/1 up')
  })
})
