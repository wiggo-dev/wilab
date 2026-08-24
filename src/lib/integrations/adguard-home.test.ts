import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchAdGuardGlance,
  formatAdGuardGlance,
  statsUrl,
} from './adguard-home'

describe('adguard-home integration', () => {
  it('builds the stats url from a service base url', () => {
    expect(statsUrl('http://adguard.lab')).toBe('http://adguard.lab/control/stats')
    expect(statsUrl('http://adguard.lab/')).toBe('http://adguard.lab/control/stats')
  })

  it('formats blocked filtering count', () => {
    expect(formatAdGuardGlance(0)).toBe('0 blocked')
    expect(formatAdGuardGlance(1284)).toBe('1284 blocked')
  })

  describe('fetchAdGuardGlance', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      fetchMock.mockReset()
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('fetches stats with Basic auth from username:password', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ num_blocked_filtering: 42, num_dns_queries: 100 }),
      })

      const text = await fetchAdGuardGlance('http://adguard.lab', 'admin:secret')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://adguard.lab/control/stats',
        expect.objectContaining({
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${Buffer.from('admin:secret', 'utf8').toString('base64')}`,
          },
        }),
      )
      expect(text).toBe('42 blocked')
    })

    it('omits Authorization when api key has no colon', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ num_blocked_filtering: 1 }),
      })

      await fetchAdGuardGlance('http://adguard.lab', '')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://adguard.lab/control/stats',
        expect.objectContaining({
          headers: { Accept: 'application/json' },
        }),
      )
    })
  })
})
