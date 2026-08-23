import type { CatalogEntry } from '@/lib/catalog/types'
import { createIntegration } from '@/lib/integrations/registry'
import type { SearchProvider, Service, WilabConfig } from './types'

export function moveId(order: string[], id: string, beforeId: string | null): string[] {
  if (id === beforeId) return order
  const next = order.filter((entry) => entry !== id)
  if (beforeId == null) return [...next, id]
  const index = next.indexOf(beforeId)
  if (index < 0) return [...next, id]
  next.splice(index, 0, id)
  return next
}

export function createServiceFromCatalog(entry: CatalogEntry, id: string): Service {
  return {
    id,
    catalogId: entry.id,
    name: entry.name,
    url: entry.defaultUrl,
    logo: entry.logo,
    tags: [],
    integration: entry.integration ? createIntegration(entry.integration) : null,
  }
}

export function createCustomService(input: {
  id: string
  name: string
  url: string
  logo: string
  tags: string[]
}): Service {
  return {
    id: input.id,
    catalogId: null,
    name: input.name,
    url: input.url,
    logo: input.logo,
    tags: input.tags,
    integration: null,
  }
}

export function addService(config: WilabConfig, service: Service): WilabConfig {
  return {
    ...config,
    services: [...config.services, service],
    gridOrder: [...config.gridOrder, service.id],
  }
}

export function addServiceFromCatalog(
  config: WilabConfig,
  entry: CatalogEntry,
  id: string,
): { config: WilabConfig; serviceId: string } {
  const service = createServiceFromCatalog(entry, id)
  return {
    config: addService(config, service),
    serviceId: service.id,
  }
}

export function updateService(
  config: WilabConfig,
  id: string,
  patch: Partial<Pick<Service, 'name' | 'url' | 'logo' | 'tags' | 'integration'>>,
): WilabConfig {
  return {
    ...config,
    services: config.services.map((service) =>
      service.id === id ? { ...service, ...patch } : service,
    ),
  }
}

export function removeService(config: WilabConfig, id: string): WilabConfig {
  return {
    ...config,
    services: config.services.filter((service) => service.id !== id),
    gridOrder: config.gridOrder.filter((entry) => entry !== id),
    pinnedOrder: config.pinnedOrder.filter((entry) => entry !== id),
  }
}

export function togglePin(config: WilabConfig, id: string): WilabConfig {
  const pinned = config.pinnedOrder.includes(id)
  return {
    ...config,
    pinnedOrder: pinned
      ? config.pinnedOrder.filter((entry) => entry !== id)
      : [...config.pinnedOrder, id],
  }
}

export function reorderGrid(
  config: WilabConfig,
  id: string,
  beforeId: string | null,
): WilabConfig {
  return {
    ...config,
    gridOrder: moveId(config.gridOrder, id, beforeId),
  }
}

export function reorderPinned(
  config: WilabConfig,
  id: string,
  beforeId: string | null,
): WilabConfig {
  return {
    ...config,
    pinnedOrder: moveId(config.pinnedOrder, id, beforeId),
  }
}

export function updateSearchProvider(
  config: WilabConfig,
  id: string,
  patch: Partial<Pick<SearchProvider, 'name' | 'template'>>,
): WilabConfig {
  return {
    ...config,
    searchProviders: config.searchProviders.map((provider) =>
      provider.id === id ? { ...provider, ...patch } : provider,
    ),
  }
}

export function addSearchProvider(config: WilabConfig, provider: SearchProvider): WilabConfig {
  return {
    ...config,
    searchProviders: [...config.searchProviders, provider],
    activeSearchProviderId: provider.id,
  }
}

export function setActiveSearchProvider(config: WilabConfig, id: string): WilabConfig {
  return {
    ...config,
    activeSearchProviderId: id,
  }
}

export function parseTagsInput(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}
