import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { WilabConfig } from '@/lib/config/types'
import {
  aggregateLiveGlances,
  getLiveGlances,
  resetLiveState,
} from './live'
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

describe('live aggregation', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    resetLiveState()
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

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

    const response = await aggregateLiveGlances(baseConfig, fetchMock, 1_000)

    expect(response.services['svc-kuma']).toEqual({ status: 'healthy', text: '1/2 up' })
    expect(response.services['svc-broken']).toEqual({ status: 'unavailable', text: 'Unavailable' })
  })

  it('coalesces repeated live requests within 30 seconds', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => 'monitor_status{monitor_id="1"} 1\n',
    })

    await getLiveGlances(baseConfig, fetchMock, 10_000)
    await getLiveGlances(baseConfig, fetchMock, 10_000 + LIVE_COALESCE_MS - 1)

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('marks previously healthy glances stale after 90 seconds', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => 'monitor_status{monitor_id="1"} 1\n',
    })

    await getLiveGlances(baseConfig, fetchMock, 0)
    fetchMock.mockRejectedValue(new Error('down'))

    const aged = await getLiveGlances(baseConfig, fetchMock, STALE_THRESHOLD_MS + 1_000)

    expect(aged.services['svc-kuma'].status).toBe('stale')
    expect(aged.services['svc-kuma'].text).toBe('1/1 up')
  })
})
