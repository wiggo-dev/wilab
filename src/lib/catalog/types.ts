export const CATALOG_ENTRY_IDS = [
  'home-assistant',
  'zigbee2mqtt',
  'esphome',
  'sonarr',
  'radarr',
  'lidarr',
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
  'adguard-home',
] as const

export type CatalogEntryId = (typeof CATALOG_ENTRY_IDS)[number]

export type IntegrationKind =
  | 'http-health'
  | 'home-assistant'
  | 'sonarr'
  | 'radarr'
  | 'lidarr'
  | 'sabnzbd'
  | 'portainer'
  | 'uptime-kuma'
  | 'prowlarr'
  | 'immich'
  | 'zigbee2mqtt'
  | 'unifi'
  | 'slzb-os'
  | 'qnap'
  | 'jellyfin'
  | 'plex'
  | 'frigate'
  | 'adguard-home'

export type CatalogEntry = {
  id: CatalogEntryId
  name: string
  defaultUrl: string
  logo: string
  integration: IntegrationKind | null
}
