import type { Service } from '@/lib/config/types'
import type { IntegrationAdapter } from './adapter'
import { sonarrAdapter, radarrAdapter } from './arr'
import { homeAssistantAdapter } from './home-assistant'
import { httpHealthAdapter } from './http-health'
import { immichAdapter } from './immich'
import { portainerAdapter } from './portainer'
import { prowlarrAdapter } from './prowlarr'
import { qnapAdapter } from './qnap'
import { sabnzbdAdapter } from './sabnzbd'
import { slzbOsAdapter } from './slzb-os'
import type { ServiceIntegration } from './types'
import { unifiAdapter } from './unifi'
import { uptimeKumaAdapter } from './uptime-kuma'
import { zigbee2mqttAdapter } from './zigbee2mqtt'

const adapters: IntegrationAdapter[] = [
  httpHealthAdapter,
  uptimeKumaAdapter,
  sonarrAdapter,
  radarrAdapter,
  sabnzbdAdapter,
  portainerAdapter,
  homeAssistantAdapter,
  prowlarrAdapter,
  immichAdapter,
  zigbee2mqttAdapter,
  unifiAdapter,
  slzbOsAdapter,
  qnapAdapter,
]

const adaptersByKind = new Map(adapters.map((adapter) => [adapter.kind, adapter]))

export function listIntegrationAdapters(): readonly IntegrationAdapter[] {
  return adapters
}

export function getAdapter(kind: string): IntegrationAdapter | undefined {
  return adaptersByKind.get(kind)
}

export async function fetchGlance(
  service: Service,
  integration: ServiceIntegration,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const adapter = adaptersByKind.get(integration.kind)
  if (!adapter) {
    throw new Error(`Unsupported integration kind: ${integration.kind}`)
  }
  return adapter.fetchGlance(service, integration, fetchImpl)
}

export function isSupportedIntegration(
  integration: Service['integration'],
): integration is ServiceIntegration {
  return integration != null && adaptersByKind.has(integration.kind)
}

export function createIntegration(kind: string): ServiceIntegration {
  const adapter = adaptersByKind.get(kind)
  if (!adapter) {
    throw new Error(`Unsupported integration kind: ${kind}`)
  }
  return adapter.createDefault()
}
