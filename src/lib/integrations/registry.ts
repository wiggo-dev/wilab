import type { Service } from '@/lib/config/types'
import type { ServiceIntegration } from './types'
import { fetchUptimeKumaGlance } from './uptime-kuma'

export async function fetchGlance(
  service: Service,
  integration: ServiceIntegration,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  switch (integration.kind) {
    case 'uptime-kuma':
      return fetchUptimeKumaGlance(service.url, integration.apiKey, fetchImpl)
    default:
      throw new Error(`Unsupported integration kind: ${integration.kind}`)
  }
}

export function isSupportedIntegration(
  integration: Service['integration'],
): integration is ServiceIntegration {
  return integration?.kind === 'uptime-kuma'
}

export function createIntegration(kind: string): ServiceIntegration {
  return { kind, apiKey: '' }
}
