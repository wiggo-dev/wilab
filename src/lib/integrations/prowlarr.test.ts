import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  countIndexers,
  countUnhealthyHealthItems,
  fetchProwlarrGlance,
  formatProwlarrGlance,
  hasHealthWarnings,
  healthUrl,
  indexerUrl,
} from './prowlarr'

describe('prowlarr integration', () => {
  it('builds v1 api urls from a service base url', () => {
    expect(healthUrl('http://prowlarr.lab:9696')).toBe('http://prowlarr.lab:9696/api/v1/health')
    expect(healthUrl('http://prowlarr.lab:9696/')).toBe('http://prowlarr.lab:9696/api/v1/health')
    expect(indexerUrl('http://prowlarr.lab:9696')).toBe('http://prowlarr.lab:9696/api/v1/indexer')
  })

  it('counts non-ok health items and detects error or warning', () => {
    const health = [
      { type: 'ok' },
      { type: 'notice' },
      { type: 'warning' },
      { type: 'error' },
    ]

    expect(hasHealthWarnings(health)).toBe(true)
    expect(countUnhealthyHealthItems(health)).toBe(3)
  })

  it('counts enabled indexers', () => {
    expect(
      countIndexers([
        { enable: true },
        { enable: true },
        { enable: false },
      ]),
    ).toEqual({ enabled: 2, total: 3 })
  })

  describe('formatProwlarrGlance', () => {
    it('shows unhealthy count when health has warning or error', () => {
      expect(
        formatProwlarrGlance({
          health: [{ type: 'ok' }, { type: 'warning' }],
          indexers: [{ enable: true }],
        }),
      ).toBe('1 unhealthy')
    })

    it('shows enabled indexers when health is ok', () => {
      expect(
        formatProwlarrGlance({
          health: [{ type: 'ok' }],
          indexers: [{ enable: true }, { enable: false }],
        }),
      ).toBe('1/2 indexers')
    })

    it('shows 0/0 indexers when none are configured', () => {
      expect(
        formatProwlarrGlance({
          health: [],
          indexers: [],
        }),
      ).toBe('0/0 indexers')
    })

    it('shows indexers when only notice-level health items exist', () => {
      expect(
        formatProwlarrGlance({
          health: [{ type: 'notice' }],
          indexers: [{ enable: true }],
        }),
      ).toBe('1/1 indexers')
    })
  })

  describe('fetchProwlarrGlance', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      fetchMock.mockReset()
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('fetches health and indexers with the api key header', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('/health')) {
          return { ok: true, json: async () => [{ type: 'ok' }] }
        }
        return {
          ok: true,
          json: async () => [{ enable: true }, { enable: true }, { enable: false }],
        }
      })

      const text = await fetchProwlarrGlance('http://prowlarr.lab:9696', 'prowlarr_key', fetchMock)

      expect(fetchMock).toHaveBeenCalledWith(
        'http://prowlarr.lab:9696/api/v1/health',
        expect.objectContaining({
          headers: { 'X-Api-Key': 'prowlarr_key' },
        }),
      )
      expect(fetchMock).toHaveBeenCalledWith(
        'http://prowlarr.lab:9696/api/v1/indexer',
        expect.objectContaining({
          headers: { 'X-Api-Key': 'prowlarr_key' },
        }),
      )
      expect(text).toBe('2/3 indexers')
    })
  })
})
