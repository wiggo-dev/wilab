import { apiKeyAdapter } from './adapter'

function apiBase(serviceUrl: string): string {
  return serviceUrl.replace(/\/$/, '')
}

export function queueStatusUrl(serviceUrl: string): string {
  return `${apiBase(serviceUrl)}/api/v3/queue/status`
}

export function wantedMissingUrl(serviceUrl: string): string {
  return `${apiBase(serviceUrl)}/api/v3/wanted/missing?page=1&pageSize=1`
}

export function formatArrGlance(counts: { queue: number; missing: number }): string {
  const { queue, missing } = counts

  if (queue > 0 && missing > 0) return `Queue ${queue} · ${missing} missing`
  if (queue > 0) return `Queue ${queue}`
  if (missing > 0) return `${missing} missing`
  return 'Queue 0'
}

type QueueStatusResponse = {
  totalCount?: number
}

type WantedMissingResponse = {
  totalRecords?: number
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

export async function fetchArrGlance(
  serviceUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const [queueStatus, missing] = await Promise.all([
    fetchJson<QueueStatusResponse>(
      queueStatusUrl(serviceUrl),
      apiKey,
      fetchImpl,
      'Arr queue status',
    ),
    fetchJson<WantedMissingResponse>(
      wantedMissingUrl(serviceUrl),
      apiKey,
      fetchImpl,
      'Arr wanted missing',
    ),
  ])

  return formatArrGlance({
    queue: queueStatus.totalCount ?? 0,
    missing: missing.totalRecords ?? 0,
  })
}

export const sonarrAdapter = apiKeyAdapter('sonarr', fetchArrGlance)
export const radarrAdapter = apiKeyAdapter('radarr', fetchArrGlance)
