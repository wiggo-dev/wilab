import { describe, expect, it } from 'vitest'
import type { CatalogEntry } from '@/lib/catalog/types'
import { FIXTURE_CONFIG } from '@/lib/landing/fixtures'
import {
  addSearchProvider,
  addService,
  addServiceFromCatalog,
  createCustomService,
  moveId,
  removeService,
  reorderGrid,
  togglePin,
  updateSearchProvider,
  updateService,
} from './mutations'

const sonarrEntry: CatalogEntry = {
  id: 'sonarr',
  name: 'Sonarr',
  defaultUrl: 'http://{host}:8989',
  logo: '/catalog/icons/sonarr.svg',
  integration: 'sonarr',
}

describe('config mutations', () => {
  it('adds the same catalog entry more than once with unique service ids', () => {
    const first = addServiceFromCatalog(FIXTURE_CONFIG, sonarrEntry, 'svc-sonarr-2')
    const second = addServiceFromCatalog(first.config, sonarrEntry, 'svc-sonarr-3')

    expect(second.config.services.filter((service) => service.catalogId === 'sonarr')).toHaveLength(3)
    expect(second.config.gridOrder).toContain('svc-sonarr-2')
    expect(second.config.gridOrder).toContain('svc-sonarr-3')
  })

  it('creates a catalog service with default url pre-filled', () => {
    const { config, serviceId } = addServiceFromCatalog(FIXTURE_CONFIG, sonarrEntry, 'new-sonarr')
    const service = config.services.find((entry) => entry.id === serviceId)

    expect(service).toMatchObject({
      catalogId: 'sonarr',
      name: 'Sonarr',
      url: 'http://{host}:8989',
      logo: '/catalog/icons/sonarr.svg',
      integration: { kind: 'sonarr', apiKey: '' },
    })
  })

  it('creates and adds a custom service', () => {
    const service = createCustomService({
      id: 'custom-printer',
      name: 'Printer',
      url: 'http://printer.local',
      logo: 'http://logo.example/printer.svg',
      tags: ['infra'],
    })
    const next = addService(FIXTURE_CONFIG, service)

    expect(next.services.at(-1)).toEqual(service)
    expect(next.gridOrder.at(-1)).toBe('custom-printer')
  })

  it('updates and removes a service while cleaning order arrays', () => {
    const updated = updateService(FIXTURE_CONFIG, 'svc-ha', {
      name: 'HA',
      url: 'http://ha.local:8123',
      tags: ['home', 'automation'],
      logo: '/catalog/icons/home-assistant.svg',
    })

    expect(updated.services.find((service) => service.id === 'svc-ha')).toMatchObject({
      name: 'HA',
      tags: ['home', 'automation'],
    })

    const removed = removeService(updated, 'svc-ha')
    expect(removed.services.some((service) => service.id === 'svc-ha')).toBe(false)
    expect(removed.gridOrder).not.toContain('svc-ha')
    expect(removed.pinnedOrder).not.toContain('svc-ha')
  })

  it('pins and unpins without removing the service from gridOrder', () => {
    const pinned = togglePin(FIXTURE_CONFIG, 'svc-sonarr')
    expect(pinned.pinnedOrder).toContain('svc-sonarr')
    expect(pinned.gridOrder).toContain('svc-sonarr')

    const unpinned = togglePin(pinned, 'svc-sonarr')
    expect(unpinned.pinnedOrder).not.toContain('svc-sonarr')
    expect(unpinned.gridOrder).toContain('svc-sonarr')
  })

  it('reorders grid ids', () => {
    expect(moveId(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b'])
    expect(reorderGrid(FIXTURE_CONFIG, 'svc-infra', 'svc-ha').gridOrder[0]).toBe('svc-infra')
  })

  it('updates and adds search providers', () => {
    const updated = updateSearchProvider(FIXTURE_CONFIG, 'ddg', {
      name: 'Duck Duck Go',
      template: 'https://duckduckgo.com/?q={q}&t=h_',
    })
    expect(updated.searchProviders.find((provider) => provider.id === 'ddg')).toMatchObject({
      name: 'Duck Duck Go',
    })

    const withCustom = addSearchProvider(updated, {
      id: 'searx',
      name: 'SearXNG',
      template: 'https://search.lab?q={q}',
    })
    expect(withCustom.searchProviders.at(-1)?.name).toBe('SearXNG')
    expect(withCustom.activeSearchProviderId).toBe('searx')
  })
})
