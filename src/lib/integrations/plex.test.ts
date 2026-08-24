import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  countPlexStreams,
  fetchPlexGlance,
  formatPlexGlance,
  plexApiBase,
  sessionsUrl,
} from './plex'

describe('plex integration', () => {
  it('uses the origin as the API base (strips /web UI path)', () => {
    expect(plexApiBase('http://plex.lab:32400/web')).toBe('http://plex.lab:32400')
    expect(plexApiBase('http://plex.lab:32400/web/')).toBe('http://plex.lab:32400')
    expect(plexApiBase('http://plex.lab:32400')).toBe('http://plex.lab:32400')
  })

  it('builds the sessions url from the API base', () => {
    expect(sessionsUrl('http://plex.lab:32400/web')).toBe('http://plex.lab:32400/status/sessions')
    expect(sessionsUrl('https://plex.lab:32400/')).toBe('https://plex.lab:32400/status/sessions')
  })

  it('reads stream count from MediaContainer.size', () => {
    expect(countPlexStreams({ MediaContainer: { size: 2 } })).toBe(2)
    expect(countPlexStreams({ MediaContainer: { Metadata: [{}, {}] } })).toBe(2)
    expect(countPlexStreams({})).toBe(0)
  })

  it('formats the playing count', () => {
    expect(formatPlexGlance(0)).toBe('0 playing')
    expect(formatPlexGlance(4)).toBe('4 playing')
  })

  describe('fetchPlexGlance', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      fetchMock.mockReset()
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('fetches sessions with X-Plex-Token and formats the badge', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ MediaContainer: { size: 2, Metadata: [{}, {}] } }),
      })

      const text = await fetchPlexGlance('http://plex.lab:32400/web', 'plex_token')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://plex.lab:32400/status/sessions',
        expect.objectContaining({
          headers: {
            'X-Plex-Token': 'plex_token',
            Accept: 'application/json',
          },
        }),
      )
      expect(text).toBe('2 playing')
    })
  })
})
