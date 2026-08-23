function apiBase(serviceUrl: string): string {
  return serviceUrl.replace(/\/$/, '')
}

export function healthUrl(serviceUrl: string): string {
  return `${apiBase(serviceUrl)}/api/v1/health`
}

export function indexerUrl(serviceUrl: string): string {
  return `${apiBase(serviceUrl)}/api/v1/indexer`
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

async function fetchJson<T>(
  url: string,
  apiKey: string,
  fetchImpl: typeof fetch,
  errorLabel: string,
): Promise<T> {
  const response = await fetchImpl(url, {
    headers: { 'X-Api-Key': apiKey },
  })

  if (!response.ok) {
    throw new Error(`${errorLabel} failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function fetchProwlarrGlance(
  serviceUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const [health, indexers] = await Promise.all([
    fetchJson<HealthItem[]>(healthUrl(serviceUrl), apiKey, fetchImpl, 'Prowlarr health'),
    fetchJson<Indexer[]>(indexerUrl(serviceUrl), apiKey, fetchImpl, 'Prowlarr indexers'),
  ])

  return formatProwlarrGlance({ health, indexers })
}
