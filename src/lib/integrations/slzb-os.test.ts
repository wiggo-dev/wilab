import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchSlzbOsGlance,
  formatSlzbOsGlance,
  haSensorsUrl,
  parseZbTemp,
} from './slzb-os'

describe('slzb-os integration', () => {
  it('builds the ha_sensors url from a service base url', () => {
    expect(haSensorsUrl('http://slzb-06.local')).toBe('http://slzb-06.local/ha_sensors')
    expect(haSensorsUrl('http://192.168.1.50/')).toBe('http://192.168.1.50/ha_sensors')
  })

  it('parses zigbee radio temperature from sensor payload', () => {
    expect(parseZbTemp({ zb_temp: 32.7 })).toBe(32.7)
    expect(parseZbTemp({ zb_temp2: '34.2' })).toBe(34.2)
    expect(parseZbTemp({})).toBeNull()
  })

  it('formats temperature badge or online fallback', () => {
    expect(formatSlzbOsGlance({ zb_temp: 32.74 })).toBe('32.7°C')
    expect(formatSlzbOsGlance({})).toBe('Online')
  })

  describe('fetchSlzbOsGlance', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      fetchMock.mockReset()
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('fetches ha_sensors and formats temperature', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ zb_temp: 41.2, uptime: 508125 }),
      })

      const text = await fetchSlzbOsGlance('http://slzb-06.local', '')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://slzb-06.local/ha_sensors',
        expect.objectContaining({
          headers: { Accept: 'application/json' },
        }),
      )
      expect(text).toBe('41.2°C')
    })

    it('sends basic auth when apiKey is user:pass', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ zb_temp: 30 }),
      })

      await fetchSlzbOsGlance('http://slzb-06.local', 'admin:secret')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://slzb-06.local/ha_sensors',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Basic ${Buffer.from('admin:secret', 'utf8').toString('base64')}`,
          }),
        }),
      )
    })
  })
})
