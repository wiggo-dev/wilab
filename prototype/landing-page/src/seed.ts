import type { SearchProvider, Service } from './types'

export function catalogLogo(id: string) {
  return `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/${id}.svg`
}

export const CATALOG: Service[] = [
  svc('home-assistant', 'Home Assistant', 8123, ['home'], 'home-assistant', '3 lights on'),
  svc('zigbee2mqtt', 'Zigbee2MQTT', 8080, ['home'], null, null),
  svc('esphome', 'ESPHome', 6052, ['home'], null, null),
  svc('sonarr', 'Sonarr', 8989, ['media'], 'sonarr', 'Queue 2'),
  svc('radarr', 'Radarr', 7878, ['media'], 'radarr', '1 missing'),
  svc('sabnzbd', 'SABnzbd', 8080, ['media'], 'sabnzbd', '1.8 MB/s'),
  svc('prowlarr', 'Prowlarr', 9696, ['media'], null, null),
  svc('portainer', 'Portainer', 9443, ['infra'], 'portainer', '8 / 10 running', 'https'),
  svc('immich', 'Immich', 2283, ['photos'], null, null),
  svc('uptime-kuma', 'Uptime Kuma', 3001, ['infra'], 'uptime-kuma', '14 / 14 up'),
  svc('jellyfin', 'Jellyfin', 8096, ['media'], null, null),
  svc('qnap', 'QNAP', 8080, ['infra'], null, null),
  svc('plex', 'Plex', 32400, ['media'], null, null, 'http', '/web'),
  svc('vaultwarden', 'Vaultwarden', 80, ['security'], null, null),
  svc('actual-budget', 'Actual Budget', 5006, ['finance'], null, null),
  svc('frigate', 'Frigate', 8971, ['home'], null, null),
]

const INITIAL_IDS = [
  'home-assistant',
  'zigbee2mqtt',
  'sonarr',
  'radarr',
  'sabnzbd',
  'portainer',
  'immich',
  'uptime-kuma',
  'jellyfin',
  'plex',
  'frigate',
]

export const CUSTOM_ROUTER: Service = {
  id: 'custom-router',
  catalogId: null,
  name: 'Router',
  url: 'http://192.168.1.1',
  logo: '',
  tags: ['infra'],
  source: 'custom',
  integrationId: null,
  credential: '',
  live: null,
}

export const INITIAL_SERVICES: Service[] = [
  ...CATALOG.filter((s) => INITIAL_IDS.includes(s.id)),
  CUSTOM_ROUTER,
]

export const INITIAL_GRID_ORDER = [...INITIAL_IDS, CUSTOM_ROUTER.id]

export const INITIAL_PINNED_ORDER = [
  'home-assistant',
  'jellyfin',
  'immich',
  'uptime-kuma',
]

export const SEARCH_PROVIDERS: SearchProvider[] = [
  { id: 'ddg', name: 'DuckDuckGo', template: 'https://duckduckgo.com/?q={q}' },
  { id: 'google', name: 'Google', template: 'https://www.google.com/search?q={q}' },
  { id: 'bing', name: 'Bing', template: 'https://www.bing.com/search?q={q}' },
  { id: 'startpage', name: 'Startpage', template: 'https://www.startpage.com/sp/search?query={q}' },
]

function svc(
  id: string,
  name: string,
  port: number,
  tags: string[],
  integrationId: Service['integrationId'],
  live: string | null,
  protocol: 'http' | 'https' = 'http',
  path = '',
): Service {
  const portPart = port === 80 ? '' : `:${port}`
  return {
    id,
    catalogId: id,
    name,
    url: `${protocol}://${id}.lab.lan${portPart}${path}`,
    logo: catalogLogo(id),
    tags,
    source: 'catalog',
    integrationId,
    credential: integrationId ? '••••••••' : '',
    live,
  }
}
