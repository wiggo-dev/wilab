import { catalogLogoPath } from '@/lib/catalog/catalog'
import type { DisplayService, Service, WilabConfig } from '@/lib/config/types'

export function resolveServiceLogo(service: Service): string {
  if (service.logo) return service.logo
  if (service.catalogId) return catalogLogoPath(service.catalogId)
  return ''
}

export function resolveConfigForDisplay(config: WilabConfig): WilabConfig & {
  services: DisplayService[]
} {
  return {
    ...config,
    services: config.services.map((service) => ({
      ...service,
      logo: resolveServiceLogo(service),
    })),
  }
}
