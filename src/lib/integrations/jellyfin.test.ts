import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  countPlayingSessions,
  fetchJellyfinGlance,
  formatJellyfinGlance,
  sessionsUrl,
} from './jellyfin'

describe('jellyfin integration', () => {
  it('builds the sessions url from a service base url', () => {
    expect(sessionsUrl('http://jellyfin.lab:8096')).toBe('http://jellyfin.lab:8096/Sessions')
    expect(sessionsUrl('http://jellyfin.lab:8096/')).toBe('http://jellyfin.lab:8096/Sessions')
  })

  it('counts only sessions that are currently playing', () => {
    expect(
      countPlayingSessions([
        { NowPlayingItem: { Name: 'Movie' } },
        {},
        { NowPlayingItem: { Name: 'Show' } },
      ]),
    ).toBe(2)
    expect(countPlayingSessions([])).toBe(0)
  })

  it('formats the playing count', () => {
    expect(formatJellyfinGlance(0)).toBe('0 playing')
    expect(formatJellyfinGlance(3)).toBe('3 playing')
  })

  describe('fetchJellyfinGlance', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      fetchMock.mockReset()
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('fetches sessions with MediaBrowser token auth and formats the badge', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [{ NowPlayingItem: { Name: 'Film' } }, { UserName: 'idle' }],
      })

      const text = await fetchJellyfinGlance('http://jellyfin.lab:8096', 'jf_api_key')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://jellyfin.lab:8096/Sessions',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Token="jf_api_key"'),
          }),
        }),
      )
      expect(text).toBe('1 playing')
    })
  })
})
