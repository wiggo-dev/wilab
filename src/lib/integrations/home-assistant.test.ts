import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  countLightsOn,
  fetchHomeAssistantGlance,
  formatHomeAssistantGlance,
  statesUrl,
} from './home-assistant'

describe('home-assistant integration', () => {
  it('builds the states url from a service base url', () => {
    expect(statesUrl('http://home-assistant.lab:8123')).toBe(
      'http://home-assistant.lab:8123/api/states',
    )
    expect(statesUrl('http://home-assistant.lab:8123/')).toBe(
      'http://home-assistant.lab:8123/api/states',
    )
  })

  it('counts light entities with state on', () => {
    const states = [
      { entity_id: 'light.kitchen', state: 'on' },
      { entity_id: 'light.lounge', state: 'off' },
      { entity_id: 'light.hall', state: 'on' },
      { entity_id: 'switch.fan', state: 'on' },
      { entity_id: 'sensor.temperature', state: '21.5' },
    ]

    expect(countLightsOn(states)).toBe(2)
    expect(formatHomeAssistantGlance(2)).toBe('2 lights on')
  })

  it('includes zero lights on in the badge string', () => {
    expect(countLightsOn([])).toBe(0)
    expect(formatHomeAssistantGlance(0)).toBe('0 lights on')
  })

  describe('fetchHomeAssistantGlance', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      fetchMock.mockReset()
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('fetches states with bearer token and formats the badge', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [
          { entity_id: 'light.kitchen', state: 'on' },
          { entity_id: 'light.lounge', state: 'on' },
          { entity_id: 'light.hall', state: 'off' },
        ],
      })

      const text = await fetchHomeAssistantGlance(
        'http://home-assistant.lab:8123',
        'ha_long_lived_token',
      )

      expect(fetchMock).toHaveBeenCalledWith(
        'http://home-assistant.lab:8123/api/states',
        expect.objectContaining({
          headers: { Authorization: 'Bearer ha_long_lived_token' },
        }),
      )
      expect(text).toBe('2 lights on')
    })
  })
})
