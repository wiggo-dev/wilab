import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  formatHttpHealthGlance,
  healthCheckUrl,
  fetchHttpHealthGlance,
} from './http-health'
import { withUpstreamTimeout } from './upstream-timeout'

describe('http-health integration', () => {
  it('uses the service url when path is empty', () => {
    expect(healthCheckUrl('http://jellyfin.lab:8096', '')).toBe('http://jellyfin.lab:8096')
    expect(healthCheckUrl('http://jellyfin.lab:8096/', '  ')).toBe('http://jellyfin.lab:8096/')
  })

  it('resolves a health path against the service origin', () => {
    expect(healthCheckUrl('http://plex.lab:32400/web', '/health')).toBe(
      'http://plex.lab:32400/health',
    )
    expect(healthCheckUrl('http://vault.lab/', 'health')).toBe('http://vault.lab/health')
  })

  it('formats 2xx as Up and non-2xx as the status code', () => {
    expect(formatHttpHealthGlance(200)).toBe('Up')
    expect(formatHttpHealthGlance(204)).toBe('Up')
    expect(formatHttpHealthGlance(503)).toBe('503')
    expect(formatHttpHealthGlance(404)).toBe('404')
  })

  describe('fetchHttpHealthGlance', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      fetchMock.mockReset()
    })

    it('returns Up for a 2xx response', async () => {
      fetchMock.mockResolvedValue({ ok: true, status: 200 })

      await expect(
        fetchHttpHealthGlance('http://jellyfin.lab:8096', '', fetchMock),
      ).resolves.toBe('Up')
      expect(fetchMock).toHaveBeenCalledWith('http://jellyfin.lab:8096', { method: 'GET' })
    })

    it('returns the status code for a non-2xx response', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 503 })

      await expect(
        fetchHttpHealthGlance('http://vault.lab', '/health', fetchMock),
      ).resolves.toBe('503')
      expect(fetchMock).toHaveBeenCalledWith('http://vault.lab/health', { method: 'GET' })
    })

    it('propagates network failures so the glance can become unavailable', async () => {
      fetchMock.mockRejectedValue(new Error('connect ECONNREFUSED'))

      await expect(
        fetchHttpHealthGlance('http://down.lab', '', fetchMock),
      ).rejects.toThrow('connect ECONNREFUSED')
    })

    it('times out when the upstream never responds', async () => {
      fetchMock.mockImplementation(() => new Promise(() => {}))

      await expect(
        withUpstreamTimeout(
          fetchHttpHealthGlance('http://slow.lab', '', fetchMock),
          20,
          'Connection timed out',
        ),
      ).rejects.toThrow('Connection timed out')
    })
  })
})
