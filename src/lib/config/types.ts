export const SCHEMA_VERSION = 1

export type SearchProvider = {
  id: string
  name: string
  template: string
}

export type Service = {
  id: string
  catalogId: string | null
  name: string
  url: string
  logo: string
  tags: string[]
  integration: null | { kind: string }
}

export type WilabConfig = {
  schemaVersion: number
  services: Service[]
  gridOrder: string[]
  pinnedOrder: string[]
  searchProviders: SearchProvider[]
  activeSearchProviderId: string
}

export type DisplayService = Service & {
  logo: string
}
