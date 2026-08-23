import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchImmichGlance,
  formatImmichGlance,
  statisticsUrl,
} from './immich'

describe('immich integration', () => {
  it('builds the statistics url from a service base url', () => {
    expect(statisticsUrl('http://immich.lab:2283')).toBe(
      'http://immich.lab:2283/api/server/statistics',
    )
    expect(statisticsUrl('http://immich.lab:2283/')).toBe(
      'http://immich.lab:2283/api/server/statistics',
    )
  })

  it('formats photo count in the badge string', () => {
    expect(formatImmichGlance({ photos: 12345 })).toBe('12345 photos')
    expect(formatImmichGlance({})).toBe('0 photos')
  })

  describe('fetchImmichGlance', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      fetchMock.mockReset()
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('fetches statistics with api key and formats the badge', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ photos: 842, videos: 16, usage: 1073741824 }),
      })

      const text = await fetchImmichGlance('http://immich.lab:2283', 'immich_api_key')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://immich.lab:2283/api/server/statistics',
        expect.objectContaining({
          headers: {
            'x-api-key': 'immich_api_key',
            Accept: 'application/json',
          },
        }),
      )
      expect(text).toBe('842 photos')
    })
  })
})
