import { useMemo, useState } from 'react'
import {
  CATALOG,
  INITIAL_GRID_ORDER,
  INITIAL_PINNED_ORDER,
  INITIAL_SERVICES,
  SEARCH_PROVIDERS,
} from './seed'
import type { LandingApi, LandingState, SearchProvider, Service } from './types'

function moveId(order: string[], id: string, beforeId: string | null) {
  if (id === beforeId) return order
  const next = order.filter((x) => x !== id)
  if (beforeId == null) return [...next, id]
  const i = next.indexOf(beforeId)
  if (i < 0) return [...next, id]
  next.splice(i, 0, id)
  return next
}

export function useLandingState(): LandingApi {
  const [state, setState] = useState<LandingState>({
    services: INITIAL_SERVICES,
    gridOrder: INITIAL_GRID_ORDER,
    pinnedOrder: INITIAL_PINNED_ORDER,
    activeTag: null,
    searchProviderId: 'ddg',
    searchProviders: SEARCH_PROVIDERS,
    editMode: false,
    searchQuery: '',
  })

  const byId = useMemo(() => {
    const map = new Map(state.services.map((s) => [s.id, s]))
    return map
  }, [state.services])

  const pinnedServices = state.pinnedOrder
    .map((id) => byId.get(id))
    .filter((s): s is Service => Boolean(s))

  const gridServices = state.gridOrder
    .map((id) => byId.get(id))
    .filter((s): s is Service => Boolean(s))
    .filter((s) => (state.activeTag ? s.tags.includes(state.activeTag) : true))

  const allTags = [...new Set(state.services.flatMap((s) => s.tags))].sort()

  const api: LandingApi = {
    state,
    allTags,
    pinnedServices,
    gridServices,
    catalog: CATALOG,
    toggleEditMode: () => setState((s) => ({ ...s, editMode: !s.editMode })),
    setTag: (tag) => setState((s) => ({ ...s, activeTag: tag })),
    setSearchQuery: (q) => setState((s) => ({ ...s, searchQuery: q })),
    setSearchProviderId: (id) => setState((s) => ({ ...s, searchProviderId: id })),
    updateSearchProvider: (id, patch) =>
      setState((s) => ({
        ...s,
        searchProviders: s.searchProviders.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      })),
    addSearchProvider: (provider: SearchProvider) =>
      setState((s) => ({
        ...s,
        searchProviders: [...s.searchProviders, provider],
        searchProviderId: provider.id,
      })),
    togglePin: (id) =>
      setState((s) => ({
        ...s,
        pinnedOrder: s.pinnedOrder.includes(id)
          ? s.pinnedOrder.filter((x) => x !== id)
          : [...s.pinnedOrder, id],
      })),
    reorderGrid: (id, beforeId) =>
      setState((s) => ({ ...s, gridOrder: moveId(s.gridOrder, id, beforeId) })),
    reorderPinned: (id, beforeId) =>
      setState((s) => ({ ...s, pinnedOrder: moveId(s.pinnedOrder, id, beforeId) })),
    addService: (service) =>
      setState((s) => ({
        ...s,
        services: [...s.services, service],
        gridOrder: [...s.gridOrder, service.id],
      })),
    addFromCatalog: (catalogId) => {
      const entry = CATALOG.find((c) => c.id === catalogId)
      if (!entry) return null
      const service: Service = {
        ...entry,
        id: `${entry.id}-${Math.random().toString(36).slice(2, 7)}`,
        catalogId: entry.id,
        credential: '',
      }
      setState((s) => ({
        ...s,
        services: [...s.services, service],
        gridOrder: [...s.gridOrder, service.id],
      }))
      return service.id
    },
    updateService: (id, patch) =>
      setState((s) => ({
        ...s,
        services: s.services.map((svc) => (svc.id === id ? { ...svc, ...patch } : svc)),
      })),
    removeService: (id) =>
      setState((s) => ({
        ...s,
        services: s.services.filter((svc) => svc.id !== id),
        gridOrder: s.gridOrder.filter((x) => x !== id),
        pinnedOrder: s.pinnedOrder.filter((x) => x !== id),
      })),
    submitSearch: () => {
      const provider = state.searchProviders.find((p) => p.id === state.searchProviderId)
      if (!provider || !state.searchQuery.trim()) return
      const url = provider.template.replace('{q}', encodeURIComponent(state.searchQuery.trim()))
      window.open(url, '_blank', 'noopener')
    },
  }

  return api
}

export function snapshot(state: LandingState) {
  return {
    editMode: state.editMode,
    activeTag: state.activeTag,
    searchProviderId: state.searchProviderId,
    searchQuery: state.searchQuery,
    pinnedOrder: state.pinnedOrder,
    gridOrder: state.gridOrder,
    services: state.services.map((s) => ({
      id: s.id,
      catalogId: s.catalogId,
      name: s.name,
      url: s.url,
      tags: s.tags,
      source: s.source,
      integrationId: s.integrationId,
      hasCredential: Boolean(s.credential),
      live: s.live,
    })),
  }
}
