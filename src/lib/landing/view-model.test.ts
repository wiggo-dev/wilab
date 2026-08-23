import { describe, expect, it } from 'vitest'
import { FIXTURE_CONFIG } from './fixtures'
import {
  allTags,
  buildSearchUrl,
  gridServices,
  orderServices,
  pinnedServices,
} from './view-model'

describe('landing view-model', () => {
  const { services, gridOrder, pinnedOrder } = FIXTURE_CONFIG

  it('orders services by id list', () => {
    expect(orderServices(services, gridOrder).map((service) => service.id)).toEqual([
      'svc-ha',
      'svc-jellyfin',
      'svc-sonarr',
      'svc-radarr',
      'svc-infra',
    ])
  })

  it('returns all pinned services regardless of tag filter', () => {
    const pinned = pinnedServices(services, pinnedOrder)
    expect(pinned).toHaveLength(2)
    expect(pinned.map((service) => service.name)).toEqual(['Home Assistant', 'Jellyfin'])

    const filteredGrid = gridServices(services, gridOrder, 'media')
    expect(filteredGrid.map((service) => service.name)).toEqual(['Jellyfin', 'Sonarr', 'Radarr'])
    expect(pinned.map((service) => service.name)).toEqual(['Home Assistant', 'Jellyfin'])
  })

  it('narrows the main grid when a tag is active', () => {
    expect(gridServices(services, gridOrder, null)).toHaveLength(5)
    expect(gridServices(services, gridOrder, 'media').map((service) => service.name)).toEqual([
      'Jellyfin',
      'Sonarr',
      'Radarr',
    ])
    expect(gridServices(services, gridOrder, 'infra').map((service) => service.name)).toEqual([
      'Router',
    ])
  })

  it('collects sorted unique tags', () => {
    expect(allTags(services)).toEqual(['home', 'infra', 'media'])
  })

  it('builds a search provider URL from the active template', () => {
    expect(buildSearchUrl('https://duckduckgo.com/?q={q}', 'hello world')).toBe(
      'https://duckduckgo.com/?q=hello%20world',
    )
    expect(buildSearchUrl('https://duckduckgo.com/?q={q}', '   ')).toBeNull()
  })
})
