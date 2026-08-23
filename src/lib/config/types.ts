export const SCHEMA_VERSION = 1

export type SearchProvider = {
  id: string
  name: string
  template: string
}

export type WilabConfig = {
  schemaVersion: number
  services: unknown[]
  gridOrder: string[]
  pinnedOrder: string[]
  searchProviders: SearchProvider[]
  activeSearchProviderId: string
}
