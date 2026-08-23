import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  clientsUrl,
  countClients,
  fetchUniFiGlance,
  formatUniFiGlance,
  pickSiteId,
  sitesUrl,
} from './unifi'

describe('unifi integration', () => {
  it('builds integration API urls', () => {
    expect(sitesUrl('https://udm.local')).toBe(
      'https://udm.local/proxy/network/integration/v1/sites',
    )
    expect(clientsUrl('https://udm.local', 'site-uuid')).toBe(
      'https://udm.local/proxy/network/integration/v1/sites/site-uuid/clients',
    )
  })

  it('prefers the default site', () => {
    expect(
      pickSiteId([
        { id: 'other', name: 'office' },
        { id: 'abc', internalReference: 'default' },
      ]),
    ).toBe('abc')
    expect(pickSiteId([{ id: 'only', name: 'home' }])).toBe('only')
  })

  it('formats client count badge', () => {
    expect(formatUniFiGlance(12)).toBe('12 clients')
  })

  it('counts clients from list or totalCount', () => {
    expect(countClients({ totalCount: 7 })).toBe(7)
    expect(countClients({ data: [{ id: '1' }, { id: '2' }] })).toBe(2)
  })

  describe('fetchUniFiGlance', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      fetchMock.mockReset()
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('fetches sites then clients with api key auth', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: 'site-1', internalReference: 'default' }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }] }),
        })

      const text = await fetchUniFiGlance('https://udm.local', 'unifi_api_key')

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://udm.local/proxy/network/integration/v1/sites',
        expect.objectContaining({
          headers: {
            'X-API-KEY': 'unifi_api_key',
            Accept: 'application/json',
          },
        }),
      )
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://udm.local/proxy/network/integration/v1/sites/site-1/clients',
        expect.objectContaining({
          headers: {
            'X-API-KEY': 'unifi_api_key',
            Accept: 'application/json',
          },
        }),
      )
      expect(text).toBe('3 clients')
    })
  })
})
