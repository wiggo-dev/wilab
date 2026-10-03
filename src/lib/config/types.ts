import type { ServiceIntegration } from '@/lib/integrations/types'

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
  /** Optional browser link when remote clients cannot reach `url` (LAN / .local). */
  openUrl: string | null
  logo: string
  tags: string[]
  integration: null | ServiceIntegration
}

export type WilabConfig = {
  schemaVersion: number
  services: Service[]
  gridOrder: string[]
  pinnedOrder: string[]
  searchProviders: SearchProvider[]
  activeSearchProviderId: string
  hostPresets: string[]
}

export type DisplayService = Service & {
  logo: string
}
