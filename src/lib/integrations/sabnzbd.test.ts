import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  formatSabnzbdGlance,
  parseSabnzbdQueue,
  queueApiUrl,
  fetchSabnzbdGlance,
} from './sabnzbd'

describe('sabnzbd integration', () => {
  it('builds the queue api url with the api key', () => {
    expect(queueApiUrl('http://sab.lab:8080', 'abc123')).toBe(
      'http://sab.lab:8080/api?mode=queue&output=json&apikey=abc123',
    )
    expect(queueApiUrl('http://sab.lab:8080/', 'abc123')).toBe(
      'http://sab.lab:8080/api?mode=queue&output=json&apikey=abc123',
    )
  })

  describe('formatSabnzbdGlance', () => {
    it('shows download speed while active', () => {
      expect(formatSabnzbdGlance({ paused: false, status: 'Downloading', kbpersec: '1843.2' })).toBe(
        '1.8 MB/s',
      )
    })

    it('shows kb/s for slower downloads', () => {
      expect(formatSabnzbdGlance({ paused: false, status: 'Downloading', kbpersec: '512' })).toBe(
        '512 KB/s',
      )
    })

    it('shows Paused when the queue is paused', () => {
      expect(formatSabnzbdGlance({ paused: true, status: 'Downloading', kbpersec: '1296' })).toBe(
        'Paused',
      )
    })

    it('shows Idle when nothing is downloading', () => {
      expect(formatSabnzbdGlance({ paused: false, status: 'Idle', kbpersec: '0.00' })).toBe('Idle')
    })
  })

  describe('parseSabnzbdQueue', () => {
    it('extracts glance fields from the queue payload', () => {
      expect(
        parseSabnzbdQueue({
          queue: { status: 'Downloading', paused: false, kbpersec: '1296.02' },
        }),
      ).toEqual({ paused: false, status: 'Downloading', kbpersec: '1296.02' })
    })
  })

  describe('fetchSabnzbdGlance', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      fetchMock.mockReset()
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('fetches queue mode and formats the badge', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          queue: { status: 'Downloading', paused: false, kbpersec: '1843.2' },
        }),
      })

      const text = await fetchSabnzbdGlance('http://sab.lab:8080', 'key', fetchMock)

      expect(text).toBe('1.8 MB/s')
      expect(fetchMock).toHaveBeenCalledWith(
        'http://sab.lab:8080/api?mode=queue&output=json&apikey=key',
      )
    })

    it('throws when the queue request fails', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 403 })

      await expect(fetchSabnzbdGlance('http://sab.lab:8080', 'bad', fetchMock)).rejects.toThrow(
        'SABnzbd queue failed: 403',
      )
    })
  })
})
