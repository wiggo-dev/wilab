import type { Service } from '@/lib/config/types'
import type { ServiceIntegration } from './types'
import { fetchArrGlance } from './arr'
import { fetchHomeAssistantGlance } from './home-assistant'
import { fetchPortainerGlance } from './portainer'
import { fetchSabnzbdGlance } from './sabnzbd'
import { fetchUptimeKumaGlance } from './uptime-kuma'

const SUPPORTED_KINDS = new Set([
  'uptime-kuma',
  'sonarr',
  'radarr',
  'sabnzbd',
  'portainer',
  'home-assistant',
])

export async function fetchGlance(
  service: Service,
  integration: ServiceIntegration,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  switch (integration.kind) {
    case 'uptime-kuma':
      return fetchUptimeKumaGlance(service.url, integration.apiKey, fetchImpl)
    case 'sonarr':
    case 'radarr':
      return fetchArrGlance(service.url, integration.apiKey, fetchImpl)
    case 'sabnzbd':
      return fetchSabnzbdGlance(service.url, integration.apiKey, fetchImpl)
    case 'portainer':
      return fetchPortainerGlance(service.url, integration.apiKey, fetchImpl)
    case 'home-assistant':
      return fetchHomeAssistantGlance(service.url, integration.apiKey, fetchImpl)
    default:
      throw new Error(`Unsupported integration kind: ${integration.kind}`)
  }
}

export function isSupportedIntegration(
  integration: Service['integration'],
): integration is ServiceIntegration {
  return integration != null && SUPPORTED_KINDS.has(integration.kind)
}

export function createIntegration(kind: string): ServiceIntegration {
  return { kind, apiKey: '' }
}
