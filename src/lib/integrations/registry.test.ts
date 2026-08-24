import { describe, expect, it } from 'vitest'
import { CATALOG_ENTRIES } from '@/lib/catalog/entries'
import type { IntegrationKind } from '@/lib/catalog/types'
import { listIntegrationAdapters } from './registry'

const INTEGRATION_KINDS: IntegrationKind[] = [
  'http-health',
  'home-assistant',
  'sonarr',
  'radarr',
  'lidarr',
  'sabnzbd',
  'portainer',
  'uptime-kuma',
  'prowlarr',
  'immich',
  'zigbee2mqtt',
  'unifi',
  'slzb-os',
  'qnap',
  'jellyfin',
  'plex',
  'frigate',
  'adguard-home',
]

describe('integration adapter registry', () => {
  it('registers every IntegrationKind', () => {
    const registered = new Set(listIntegrationAdapters().map((adapter) => adapter.kind))
    for (const kind of INTEGRATION_KINDS) {
      expect(registered.has(kind), `missing adapter for ${kind}`).toBe(true)
    }
  })

  it('has an IntegrationKind for every registered adapter', () => {
    const kinds = new Set<string>(INTEGRATION_KINDS)
    for (const adapter of listIntegrationAdapters()) {
      expect(kinds.has(adapter.kind), `adapter ${adapter.kind} not in IntegrationKind`).toBe(true)
    }
  })

  it('covers every catalog entry integration string', () => {
    const registered = new Set(listIntegrationAdapters().map((adapter) => adapter.kind))
    for (const entry of CATALOG_ENTRIES) {
      if (entry.integration == null) continue
      expect(
        registered.has(entry.integration),
        `catalog ${entry.id} integration ${entry.integration} has no adapter`,
      ).toBe(true)
    }
  })
})
