import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  countCameras,
  fetchFrigateGlance,
  formatFrigateGlance,
  statsUrl,
} from './frigate'

describe('frigate integration', () => {
  it('builds the stats url from a service base url', () => {
    expect(statsUrl('http://frigate.lab:8971')).toBe('http://frigate.lab:8971/api/stats')
    expect(statsUrl('http://frigate.lab:5000/')).toBe('http://frigate.lab:5000/api/stats')
  })

  it('counts online cameras by camera_fps', () => {
    expect(
      countCameras({
        cameras: {
          front: { camera_fps: 5.1 },
          side: { camera_fps: 0 },
          back: { camera_fps: 5 },
        },
      }),
    ).toEqual({ online: 2, total: 3 })
    expect(countCameras({})).toEqual({ online: 0, total: 0 })
  })

  it('formats the camera ratio', () => {
    expect(formatFrigateGlance({ online: 4, total: 5 })).toBe('4/5 cameras')
    expect(formatFrigateGlance({ online: 0, total: 0 })).toBe('0/0 cameras')
  })

  describe('fetchFrigateGlance', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      fetchMock.mockReset()
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('fetches stats with Bearer token when api key is set', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          cameras: {
            a: { camera_fps: 5 },
            b: { camera_fps: 0 },
          },
        }),
      })

      const text = await fetchFrigateGlance('http://frigate.lab:8971', 'jwt-token')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://frigate.lab:8971/api/stats',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer jwt-token',
            Accept: 'application/json',
          },
        }),
      )
      expect(text).toBe('1/2 cameras')
    })

    it('omits Authorization when api key is empty', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ cameras: { cam: { camera_fps: 5 } } }),
      })

      const text = await fetchFrigateGlance('http://frigate.lab:5000', '')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://frigate.lab:5000/api/stats',
        expect.objectContaining({
          headers: { Accept: 'application/json' },
        }),
      )
      expect(text).toBe('1/1 cameras')
    })
  })
})
