import type { Service } from '@/lib/config/types'

/** Browser href for a service tile — openUrl when set, otherwise url. */
export function serviceHref(service: Pick<Service, 'url' | 'openUrl'>): string {
  const openUrl = service.openUrl?.trim()
  return openUrl || service.url
}
