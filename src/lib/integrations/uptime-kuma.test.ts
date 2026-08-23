import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  formatUptimeKumaGlance,
  metricsUrl,
  parseUptimeKumaMetrics,
  fetchUptimeKumaGlance,
} from './uptime-kuma'

describe('uptime-kuma integration', () => {
  it('builds the metrics url from a service base url', () => {
    expect(metricsUrl('http://kuma.lab:3001')).toBe('http://kuma.lab:3001/metrics')
    expect(metricsUrl('http://kuma.lab:3001/')).toBe('http://kuma.lab:3001/metrics')
  })

  it('parses monitor_status gauges into up/total counts', () => {
    const body = `
monitor_status{monitor_id="1",monitor_name="Gitea"} 1
monitor_status{monitor_id="2",monitor_name="DNS"} 0
monitor_status{monitor_id="3",monitor_name="NAS"} 1
monitor_response_time{monitor_id="1",monitor_name="Gitea"} 55
`
    expect(parseUptimeKumaMetrics(body)).toEqual({ up: 2, total: 3 })
    expect(formatUptimeKumaGlance({ up: 2, total: 3 })).toBe('2/3 up')
  })

  it('returns zero totals for empty metrics', () => {
    expect(parseUptimeKumaMetrics('')).toEqual({ up: 0, total: 0 })
    expect(formatUptimeKumaGlance({ up: 0, total: 0 })).toBe('0/0 up')
  })

  describe('fetchUptimeKumaGlance', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      fetchMock.mockReset()
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('fetches metrics with api key basic auth and formats the badge', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => 'monitor_status{monitor_id="1"} 1\nmonitor_status{monitor_id="2"} 1\n',
      })

      const text = await fetchUptimeKumaGlance('http://kuma.lab:3001', 'uk1_test')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://kuma.lab:3001/metrics',
        expect.objectContaining({
          headers: { Authorization: `Basic ${Buffer.from(':uk1_test').toString('base64')}` },
        }),
      )
      expect(text).toBe('2/2 up')
    })
  })
})
