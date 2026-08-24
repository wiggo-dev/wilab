import { apiKeyAdapter } from './adapter'
import { getJson, trimBase } from './upstream-request'

export function statisticsUrl(serviceUrl: string): string {
  return `${trimBase(serviceUrl)}/api/server/statistics`
}

type ServerStatistics = {
  photos?: number
}

export function formatImmichGlance(stats: ServerStatistics): string {
  const photos = stats.photos ?? 0
  return `${photos} photos`
}

export async function fetchImmichGlance(
  serviceUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const stats = await getJson<ServerStatistics>(statisticsUrl(serviceUrl), {
    headers: {
      'x-api-key': apiKey,
      Accept: 'application/json',
    },
    fetch: fetchImpl,
    label: 'Immich statistics',
  })
  return formatImmichGlance(stats)
}

export const immichAdapter = apiKeyAdapter('immich', fetchImmichGlance)
