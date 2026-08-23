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
  return orderServices(services, gridOrder).filter((service) =>
    activeTag ? service.tags.includes(activeTag) : true,
  )
}

export function allTags(services: Service[]): string[] {
  return [...new Set(services.flatMap((service) => service.tags))].sort()
}

export function buildSearchUrl(template: string, query: string): string | null {
  const trimmed = query.trim()
  if (!trimmed) return null
  return template.replace('{q}', encodeURIComponent(trimmed))
}
