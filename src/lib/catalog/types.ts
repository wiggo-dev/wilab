export const CATALOG_ENTRY_IDS = [
  'home-assistant',
  'zigbee2mqtt',
  'esphome',
  'sonarr',
  'radarr',
  'sabnzbd',
  'prowlarr',
  'portainer',
  'immich',
  'uptime-kuma',
  'unifi',
  'slzb-os',
  'jellyfin',
  'qnap',
  'plex',
  'vaultwarden',
  'actual-budget',
  'frigate',
] as const

export type CatalogEntryId = (typeof CATALOG_ENTRY_IDS)[number]

export type IntegrationKind =
  | 'http-health'
  | 'home-assistant'
  | 'sonarr'
  | 'radarr'
  | 'sabnzbd'
  | 'portainer'
  | 'uptime-kuma'
  | 'prowlarr'
  | 'immich'
  | 'zigbee2mqtt'
  | 'unifi'
  | 'slzb-os'
  | 'qnap'

export type CatalogEntry = {
  id: CatalogEntryId
  name: string
  defaultUrl: string
  logo: string
  integration: IntegrationKind | null
}
