import type { Service } from '@/lib/config/types'

export function orderServices(services: Service[], order: string[]): Service[] {
  const byId = new Map(services.map((service) => [service.id, service]))
  return order.map((id) => byId.get(id)).filter((service): service is Service => Boolean(service))
}

export function pinnedServices(services: Service[], pinnedOrder: string[]): Service[] {
  return orderServices(services, pinnedOrder)
}

export type TagMatchMode = 'and' | 'or'

export function serviceMatchesTags(
  service: Service,
  activeTags: readonly string[],
  mode: TagMatchMode,
): boolean {
  if (activeTags.length === 0) return true
  if (mode === 'and') {
    return activeTags.every((tag) => service.tags.includes(tag))
  }
  return activeTags.some((tag) => service.tags.includes(tag))
}

export function gridServices(
  services: Service[],
  gridOrder: string[],
  activeTags: readonly string[] = [],
  tagMatchMode: TagMatchMode = 'or',
): Service[] {
  const effectiveOrder =
    gridOrder.length > 0 ? gridOrder : services.map((service) => service.id)
  const listed = new Set(effectiveOrder)
  const ordered = orderServices(services, effectiveOrder)
  const trailing = services.filter((service) => !listed.has(service.id))
  const visible = [...ordered, ...trailing]

  return visible.filter((service) => serviceMatchesTags(service, activeTags, tagMatchMode))
}

export function allTags(services: Service[]): string[] {
  return [...new Set(services.flatMap((service) => service.tags))].sort()
}

export function serviceMatchesTileQuery(service: Service, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  if (service.name.toLowerCase().includes(needle)) return true
  return service.tags.some((tag) => tag.toLowerCase().includes(needle))
}

export function filterServicesByTileQuery(services: Service[], query: string): Service[] {
  return services.filter((service) => serviceMatchesTileQuery(service, query))
}

export function buildSearchUrl(template: string, query: string): string | null {
  const trimmed = query.trim()
  if (!trimmed) return null
  return template.replace('{q}', encodeURIComponent(trimmed))
}
