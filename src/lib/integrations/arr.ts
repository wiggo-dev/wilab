import { apiKeyAdapter } from './adapter'
import { getJson, trimBase } from './upstream-request'

export function queueStatusUrl(serviceUrl: string): string {
  return `${trimBase(serviceUrl)}/api/v3/queue/status`
}

export function wantedMissingUrl(serviceUrl: string): string {
  return `${trimBase(serviceUrl)}/api/v3/wanted/missing?page=1&pageSize=1`
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

export async function fetchArrGlance(
  serviceUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const headers = { 'X-Api-Key': apiKey }
  const [queueStatus, missing] = await Promise.all([
    getJson<QueueStatusResponse>(queueStatusUrl(serviceUrl), {
      headers,
      fetch: fetchImpl,
      label: 'Arr queue status',
    }),
    getJson<WantedMissingResponse>(wantedMissingUrl(serviceUrl), {
      headers,
      fetch: fetchImpl,
      label: 'Arr wanted missing',
    }),
  ])

  return formatArrGlance({
    queue: queueStatus.totalCount ?? 0,
    missing: missing.totalRecords ?? 0,
  })
}

export const sonarrAdapter = apiKeyAdapter('sonarr', fetchArrGlance)
export const radarrAdapter = apiKeyAdapter('radarr', fetchArrGlance)
