import type { Service } from '@/lib/config/types'
import type { ServiceIntegration } from './types'
import { isQnapIntegration } from './types'

function requireApiKey(integration: ServiceIntegration): string {
  if (isQnapIntegration(integration)) {
    throw new Error(`Integration kind ${integration.kind} does not use apiKey`)
  }
  return integration.apiKey
}
import { fetchArrGlance } from './arr'
import { fetchHomeAssistantGlance } from './home-assistant'
import { fetchImmichGlance } from './immich'
import { fetchPortainerGlance } from './portainer'
import { fetchProwlarrGlance } from './prowlarr'
import { fetchQnapGlance } from './qnap'
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
  'qnap',
])

export async function fetchGlance(
  service: Service,
  integration: ServiceIntegration,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  switch (integration.kind) {
    case 'uptime-kuma':
      return fetchUptimeKumaGlance(service.url, requireApiKey(integration), fetchImpl)
    case 'sonarr':
    case 'radarr':
      return fetchArrGlance(service.url, requireApiKey(integration), fetchImpl)
    case 'sabnzbd':
      return fetchSabnzbdGlance(service.url, requireApiKey(integration), fetchImpl)
    case 'portainer':
      return fetchPortainerGlance(service.url, requireApiKey(integration), fetchImpl)
    case 'home-assistant':
      return fetchHomeAssistantGlance(service.url, requireApiKey(integration), fetchImpl)
    case 'prowlarr':
      return fetchProwlarrGlance(service.url, requireApiKey(integration), fetchImpl)
    case 'immich':
      return fetchImmichGlance(service.url, requireApiKey(integration), fetchImpl)
    case 'zigbee2mqtt':
      return fetchZigbee2MqttGlance(service.url, requireApiKey(integration), fetchImpl)
    case 'unifi':
      return fetchUniFiGlance(service.url, requireApiKey(integration), fetchImpl)
    case 'slzb-os':
      return fetchSlzbOsGlance(service.url, requireApiKey(integration), fetchImpl)
    case 'qnap':
      if (!isQnapIntegration(integration)) {
        throw new Error('QNAP integration requires username and password')
      }
      return fetchQnapGlance(service.url, integration.username, integration.password, fetchImpl)
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
  if (kind === 'qnap') {
    return { kind: 'qnap', username: '', password: '' }
  }
  return { kind, apiKey: '' }
}
