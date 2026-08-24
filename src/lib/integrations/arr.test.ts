import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  formatArrGlance,
  fetchArrGlance,
  queueStatusUrl,
  wantedMissingUrl,
} from './arr'

describe('arr integration (Sonarr / Radarr)', () => {
  it('builds v3 api urls from a service base url', () => {
    expect(queueStatusUrl('http://sonarr.lab:8989')).toBe('http://sonarr.lab:8989/api/v3/queue/status')
    expect(queueStatusUrl('http://sonarr.lab:8989/')).toBe('http://sonarr.lab:8989/api/v3/queue/status')
    expect(wantedMissingUrl('http://radarr.lab:7878')).toBe(
      'http://radarr.lab:7878/api/v3/wanted/missing?page=1&pageSize=1',
    )
  })

  it('builds v1 api urls for Lidarr', () => {
    expect(queueStatusUrl('http://lidarr.lab:8686', 'v1')).toBe(
      'http://lidarr.lab:8686/api/v1/queue/status',
    )
    expect(wantedMissingUrl('http://lidarr.lab:8686', 'v1')).toBe(
      'http://lidarr.lab:8686/api/v1/wanted/missing?page=1&pageSize=1',
    )
  })

  describe('formatArrGlance', () => {
    it('shows queue and missing when both are active', () => {
      expect(formatArrGlance({ queue: 2, missing: 1 })).toBe('Queue 2 · 1 missing')
    })

    it('shows queue only when nothing is missing', () => {
      expect(formatArrGlance({ queue: 2, missing: 0 })).toBe('Queue 2')
    })

    it('shows missing only when the queue is empty', () => {
      expect(formatArrGlance({ queue: 0, missing: 1 })).toBe('1 missing')
    })

    it('shows Queue 0 when idle', () => {
      expect(formatArrGlance({ queue: 0, missing: 0 })).toBe('Queue 0')
    })
  })

  describe('fetchArrGlance', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      fetchMock.mockReset()
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('fetches queue status and missing count with the api key header', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('/queue/status')) {
          return { ok: true, json: async () => ({ totalCount: 2 }) }
        }
        if (url.includes('/wanted/missing')) {
          return { ok: true, json: async () => ({ totalRecords: 1 }) }
        }
        throw new Error(`unexpected url: ${url}`)
      })

      const text = await fetchArrGlance('http://sonarr.lab:8989', 'secret-key', fetchMock)

      expect(text).toBe('Queue 2 · 1 missing')
      expect(fetchMock).toHaveBeenCalledWith(
        'http://sonarr.lab:8989/api/v3/queue/status',
        expect.objectContaining({
          headers: { 'X-Api-Key': 'secret-key' },
        }),
      )
      expect(fetchMock).toHaveBeenCalledWith(
        'http://sonarr.lab:8989/api/v3/wanted/missing?page=1&pageSize=1',
        expect.objectContaining({
          headers: { 'X-Api-Key': 'secret-key' },
        }),
      )
    })

    it('throws when queue status request fails', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 401 })

      await expect(fetchArrGlance('http://sonarr.lab:8989', 'bad', fetchMock)).rejects.toThrow(
        'Arr queue status failed: 401',
      )
    })

    it('fetches Lidarr via api v1', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('/api/v1/queue/status')) {
          return { ok: true, json: async () => ({ totalCount: 1 }) }
        }
        if (url.includes('/api/v1/wanted/missing')) {
          return { ok: true, json: async () => ({ totalRecords: 0 }) }
        }
        throw new Error(`unexpected url: ${url}`)
      })

      const text = await fetchArrGlance('http://lidarr.lab:8686', 'lidarr_key', fetchMock, 'v1')

      expect(text).toBe('Queue 1')
      expect(fetchMock).toHaveBeenCalledWith(
        'http://lidarr.lab:8686/api/v1/queue/status',
        expect.objectContaining({
          headers: { 'X-Api-Key': 'lidarr_key' },
        }),
      )
    })
  })
})
