import type { WilabConfig } from '@/lib/config/types'
import { DEFAULT_SEARCH_PROVIDERS } from '@/lib/config/defaults'

export const FIXTURE_CONFIG: WilabConfig = {
  schemaVersion: 1,
  services: [
    {
      id: 'svc-ha',
      catalogId: 'home-assistant',
      name: 'Home Assistant',
      url: 'http://home-assistant.lab.lan:8123',
      logo: '',
      tags: ['home'],
      integration: null,
    },
    {
      id: 'svc-jellyfin',
      catalogId: 'jellyfin',
      name: 'Jellyfin',
      url: 'http://jellyfin.lab.lan:8096',
      logo: '/catalog/icons/jellyfin.svg',
      tags: ['media'],
      integration: null,
    },
    {
      id: 'svc-sonarr',
      catalogId: 'sonarr',
      name: 'Sonarr',
      url: 'http://sonarr.lab.lan:8989',
      logo: '',
      tags: ['media'],
      integration: null,
    },
    {
      id: 'svc-radarr',
      catalogId: 'radarr',
      name: 'Radarr',
      url: 'http://radarr.lab.lan:7878',
      logo: '',
      tags: ['media'],
      integration: null,
    },
    {
      id: 'svc-infra',
      catalogId: null,
      name: 'Router',
      url: 'http://192.168.1.1',
      logo: '',
      tags: ['infra'],
      integration: null,
    },
  ],
  gridOrder: ['svc-ha', 'svc-jellyfin', 'svc-sonarr', 'svc-radarr', 'svc-infra'],
  pinnedOrder: ['svc-ha', 'svc-jellyfin'],
  searchProviders: DEFAULT_SEARCH_PROVIDERS.map((provider) => ({ ...provider })),
  activeSearchProviderId: 'ddg',
  hostPresets: ['nas.local'],
}
