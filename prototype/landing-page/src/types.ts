export type IntegrationId =
  | 'home-assistant'
  | 'sonarr'
  | 'radarr'
  | 'sabnzbd'
  | 'portainer'
  | 'uptime-kuma'

export type Service = {
  id: string
  catalogId: string | null
  name: string
  url: string
  logo: string
  tags: string[]
  source: 'catalog' | 'custom'
  integrationId: IntegrationId | null
  credential: string
  live: string | null
}

export type SearchProvider = {
  id: string
  name: string
  template: string
}

export type LandingState = {
  services: Service[]
  gridOrder: string[]
  pinnedOrder: string[]
  activeTag: string | null
  searchProviderId: string
  searchProviders: SearchProvider[]
  editMode: boolean
  searchQuery: string
}

export type LandingApi = {
  state: LandingState
  allTags: string[]
  pinnedServices: Service[]
  gridServices: Service[]
  catalog: Service[]
  toggleEditMode: () => void
  setTag: (tag: string | null) => void
  setSearchQuery: (q: string) => void
  setSearchProviderId: (id: string) => void
  updateSearchProvider: (id: string, patch: Partial<SearchProvider>) => void
  addSearchProvider: (provider: SearchProvider) => void
  togglePin: (id: string) => void
  reorderGrid: (id: string, beforeId: string | null) => void
  reorderPinned: (id: string, beforeId: string | null) => void
  addService: (service: Service) => void
  addFromCatalog: (catalogId: string) => string | null
  updateService: (id: string, patch: Partial<Service>) => void
  removeService: (id: string) => void
  submitSearch: () => void
}
