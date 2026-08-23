import { DEFAULT_SEARCH_PROVIDERS } from './defaults'
import type { SearchProvider, Service, WilabConfig } from './types'
import { SCHEMA_VERSION } from './types'

function dedupePreservingOrder(ids: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const id of ids) {
    if (seen.has(id)) continue
    seen.add(id)
    result.push(id)
  }
  return result
}

function pruneOrder(order: string[], knownIds: Set<string>): string[] {
  return dedupePreservingOrder(order.filter((id) => knownIds.has(id)))
}

function normalizeSearchProviders(providers: SearchProvider[] | undefined): SearchProvider[] {
  if (!providers || providers.length === 0) {
    return DEFAULT_SEARCH_PROVIDERS.map((provider) => ({ ...provider }))
  }
  return providers
}

/**
 * Structural coerce for persisted config: prune orphan order IDs, dedupe,
 * append missing grid services, and fix the active search provider.
 * Does not validate Integration kinds.
 */
export function normalizeWilabConfig(input: WilabConfig): WilabConfig {
  const schemaVersion = input.schemaVersion === SCHEMA_VERSION ? input.schemaVersion : SCHEMA_VERSION
  const services: Service[] = Array.isArray(input.services) ? input.services : []
  const knownIds = new Set(services.map((service) => service.id))

  const pinnedOrder = pruneOrder(input.pinnedOrder ?? [], knownIds)
  let gridOrder = pruneOrder(input.gridOrder ?? [], knownIds)

  const listed = new Set(gridOrder)
  for (const service of services) {
    if (!listed.has(service.id)) {
      gridOrder = [...gridOrder, service.id]
      listed.add(service.id)
    }
  }

  const searchProviders = normalizeSearchProviders(input.searchProviders)
  const providerIds = new Set(searchProviders.map((provider) => provider.id))
  let activeSearchProviderId = input.activeSearchProviderId
  if (!activeSearchProviderId || !providerIds.has(activeSearchProviderId)) {
    activeSearchProviderId = searchProviders[0]?.id ?? 'ddg'
  }

  return {
    schemaVersion,
    services,
    gridOrder,
    pinnedOrder,
    searchProviders,
    activeSearchProviderId,
  }
}

export function configsEqual(a: WilabConfig, b: WilabConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
