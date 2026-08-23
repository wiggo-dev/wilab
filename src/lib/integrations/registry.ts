import type { Service } from '@/lib/config/types'
import type { ServiceIntegration } from './types'
import { fetchArrGlance } from './arr'
import { fetchHomeAssistantGlance } from './home-assistant'
import { fetchImmichGlance } from './immich'
import { fetchPortainerGlance } from './portainer'
import { fetchProwlarrGlance } from './prowlarr'
import { fetchSabnzbdGlance } from './sabnzbd'
import { fetchSlzbOsGlance } from './slzb-os'
import { fetchUptimeKumaGlance } from './uptime-kuma'
import { fetchUniFiGlance } from './unifi'
import { fetchZigbee2MqttGlance } from './zigbee2mqtt'

const SUPPORTED_KINDS = new Set([
  'uptime-kuma',
  'sonarr',
  'radarr',
  'sabnzbd',
  'portainer',
  'home-assistant',
  'prowlarr',
  'immich',
  'zigbee2mqtt',
  'unifi',
  'slzb-os',
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
    case 'prowlarr':
      return fetchProwlarrGlance(service.url, integration.apiKey, fetchImpl)
    case 'immich':
      return fetchImmichGlance(service.url, integration.apiKey, fetchImpl)
    case 'zigbee2mqtt':
      return fetchZigbee2MqttGlance(service.url, integration.apiKey, fetchImpl)
    case 'unifi':
      return fetchUniFiGlance(service.url, integration.apiKey, fetchImpl)
    case 'slzb-os':
      return fetchSlzbOsGlance(service.url, integration.apiKey, fetchImpl)
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
