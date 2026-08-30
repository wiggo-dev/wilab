import type { SearchProvider, WilabConfig } from './types'
import { SCHEMA_VERSION } from './types'

export const DEFAULT_SEARCH_PROVIDERS: SearchProvider[] = [
  { id: 'ddg', name: 'DuckDuckGo', template: 'https://duckduckgo.com/?q={q}' },
  { id: 'google', name: 'Google', template: 'https://www.google.com/search?q={q}' },
  { id: 'bing', name: 'Bing', template: 'https://www.bing.com/search?q={q}' },
  {
    id: 'startpage',
    name: 'Startpage',
    template: 'https://www.startpage.com/sp/search?query={q}',
  },
]

export function createDefaultConfig(): WilabConfig {
  return {
    schemaVersion: SCHEMA_VERSION,
    services: [],
    gridOrder: [],
    pinnedOrder: [],
    searchProviders: DEFAULT_SEARCH_PROVIDERS.map((provider) => ({ ...provider })),
    activeSearchProviderId: 'ddg',
    hostPresets: [],
  }
}
