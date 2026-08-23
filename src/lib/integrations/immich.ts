function apiBase(serviceUrl: string): string {
  return serviceUrl.replace(/\/$/, '')
}

export function statisticsUrl(serviceUrl: string): string {
  return `${apiBase(serviceUrl)}/api/server/statistics`
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
  const response = await fetchImpl(statisticsUrl(serviceUrl), {
    headers: {
      'x-api-key': apiKey,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Immich statistics failed: ${response.status}`)
  }

  const stats = (await response.json()) as ServerStatistics
  return formatImmichGlance(stats)
}
