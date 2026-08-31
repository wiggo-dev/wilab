import type { Service } from '@/lib/config/types'

export function orderServices(services: Service[], order: string[]): Service[] {
  const byId = new Map(services.map((service) => [service.id, service]))
  return order.map((id) => byId.get(id)).filter((service): service is Service => Boolean(service))
}

export function pinnedServices(services: Service[], pinnedOrder: string[]): Service[] {
  return orderServices(services, pinnedOrder)
}

export function gridServices(
  services: Service[],
  gridOrder: string[],
  activeTag: string | null,
): Service[] {
  const effectiveOrder =
    gridOrder.length > 0 ? gridOrder : services.map((service) => service.id)
  const listed = new Set(effectiveOrder)
  const ordered = orderServices(services, effectiveOrder)
  const trailing = services.filter((service) => !listed.has(service.id))
  const visible = [...ordered, ...trailing]

  return visible.filter((service) => (activeTag ? service.tags.includes(activeTag) : true))
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
