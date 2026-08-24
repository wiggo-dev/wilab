import { apiKeyAdapter } from './adapter'
import { getJson, trimBase } from './upstream-request'

export function healthUrl(serviceUrl: string): string {
  return `${trimBase(serviceUrl)}/api/v1/health`
}

export function indexerUrl(serviceUrl: string): string {
  return `${trimBase(serviceUrl)}/api/v1/indexer`
}

type HealthItem = {
  type?: string
}

type Indexer = {
  enable?: boolean
}

export function countUnhealthyHealthItems(health: HealthItem[]): number {
  return health.filter((item) => item.type !== 'ok').length
}

export function hasHealthWarnings(health: HealthItem[]): boolean {
  return health.some((item) => item.type === 'error' || item.type === 'warning')
}

export function countIndexers(indexers: Indexer[]): { enabled: number; total: number } {
  const enabled = indexers.filter((indexer) => indexer.enable).length
  return { enabled, total: indexers.length }
}

export function formatProwlarrGlance(input: {
  health: HealthItem[]
  indexers: Indexer[]
}): string {
  if (hasHealthWarnings(input.health)) {
    return `${countUnhealthyHealthItems(input.health)} unhealthy`
  }

  const { enabled, total } = countIndexers(input.indexers)
  return `${enabled}/${total} indexers`
}

export async function fetchProwlarrGlance(
  serviceUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const headers = { 'X-Api-Key': apiKey }
  const [health, indexers] = await Promise.all([
    getJson<HealthItem[]>(healthUrl(serviceUrl), {
      headers,
      fetch: fetchImpl,
      label: 'Prowlarr health',
    }),
    getJson<Indexer[]>(indexerUrl(serviceUrl), {
      headers,
      fetch: fetchImpl,
      label: 'Prowlarr indexers',
    }),
  ])

  return formatProwlarrGlance({ health, indexers })
}

export const prowlarrAdapter = apiKeyAdapter('prowlarr', fetchProwlarrGlance)
