import { describe, expect, it } from 'vitest'
import { FIXTURE_CONFIG } from './fixtures'
import {
  allTags,
  buildSearchUrl,
  gridServices,
  orderServices,
  pinnedServices,
  filterServicesByTileQuery,
  serviceMatchesTags,
  serviceMatchesTileQuery,
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

  it('falls back to all services when grid order is empty', () => {
    expect(gridServices(services, [], []).map((service) => service.id)).toEqual([
      'svc-ha',
      'svc-jellyfin',
      'svc-sonarr',
      'svc-radarr',
      'svc-infra',
    ])
  })

  it('appends services missing from the grid order list', () => {
    expect(gridServices(services, ['svc-ha'], []).map((service) => service.id)).toEqual([
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

    const filteredGrid = gridServices(services, gridOrder, ['media'])
    expect(filteredGrid.map((service) => service.name)).toEqual(['Jellyfin', 'Sonarr', 'Radarr'])
    expect(pinned.map((service) => service.name)).toEqual(['Home Assistant', 'Jellyfin'])
  })

  it('narrows the main grid when a tag is active', () => {
    expect(gridServices(services, gridOrder, [])).toHaveLength(5)
    expect(gridServices(services, gridOrder, ['media']).map((service) => service.name)).toEqual([
      'Jellyfin',
      'Sonarr',
      'Radarr',
    ])
    expect(gridServices(services, gridOrder, ['infra']).map((service) => service.name)).toEqual([
      'Router',
    ])
  })

  it('OR-matches services that have any selected tag', () => {
    expect(
      gridServices(services, gridOrder, ['media', 'infra'], 'or').map((service) => service.name),
    ).toEqual(['Jellyfin', 'Sonarr', 'Radarr', 'Router'])
  })

  it('AND-matches services that have every selected tag', () => {
    const multiTagged = [
      ...services,
      {
        id: 'svc-both',
        catalogId: null,
        name: 'Media NAS',
        url: 'http://nas.lab.lan',
        openUrl: null,
        logo: '',
        tags: ['media', 'infra'],
        integration: null,
      },
    ]
    const order = [...gridOrder, 'svc-both']

    expect(serviceMatchesTags(multiTagged[5]!, ['media', 'infra'], 'and')).toBe(true)
    expect(serviceMatchesTags(services[1]!, ['media', 'infra'], 'and')).toBe(false)
    expect(gridServices(multiTagged, order, ['media', 'infra'], 'and').map((s) => s.name)).toEqual([
      'Media NAS',
    ])
  })

  it('collects sorted unique tags', () => {
    expect(allTags(services)).toEqual(['home', 'infra', 'media'])
  })

  it('matches a service by name or tag substring, ignoring case and surrounding space', () => {
    const sonarr = services.find((service) => service.id === 'svc-sonarr')!
    const ha = services.find((service) => service.id === 'svc-ha')!

    expect(serviceMatchesTileQuery(sonarr, 'son')).toBe(true)
    expect(serviceMatchesTileQuery(sonarr, '  SONARR  ')).toBe(true)
    expect(serviceMatchesTileQuery(sonarr, 'media')).toBe(true)
    expect(serviceMatchesTileQuery(ha, 'media')).toBe(false)
    expect(serviceMatchesTileQuery(ha, '')).toBe(true)
    expect(serviceMatchesTileQuery(ha, '   ')).toBe(true)
  })

  it('intersects tag-filtered grid results with a tile query', () => {
    const mediaGrid = gridServices(services, gridOrder, ['media'])
    expect(filterServicesByTileQuery(mediaGrid, 'son').map((service) => service.name)).toEqual([
      'Sonarr',
    ])
    expect(filterServicesByTileQuery(mediaGrid, '').map((service) => service.name)).toEqual([
      'Jellyfin',
      'Sonarr',
      'Radarr',
    ])
  })

  it('builds a search provider URL from the active template', () => {
    expect(buildSearchUrl('https://duckduckgo.com/?q={q}', 'hello world')).toBe(
      'https://duckduckgo.com/?q=hello%20world',
    )
    expect(buildSearchUrl('https://duckduckgo.com/?q={q}', '   ')).toBeNull()
  })
})
