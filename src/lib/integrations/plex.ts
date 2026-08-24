import { apiKeyAdapter } from './adapter'
import { getJson } from './upstream-request'

export function plexApiBase(serviceUrl: string): string {
  return new URL(serviceUrl).origin
}

export function sessionsUrl(serviceUrl: string): string {
  return `${plexApiBase(serviceUrl)}/status/sessions`
}

type PlexSessionsResponse = {
  MediaContainer?: {
    size?: number
    Metadata?: unknown[]
  }
}

export function countPlexStreams(body: PlexSessionsResponse): number {
  const container = body.MediaContainer
  if (!container) return 0
  if (typeof container.size === 'number') return container.size
  return container.Metadata?.length ?? 0
}

export function formatPlexGlance(playing: number): string {
  return `${playing} playing`
}

export async function fetchPlexGlance(
  serviceUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const body = await getJson<PlexSessionsResponse>(sessionsUrl(serviceUrl), {
    headers: {
      'X-Plex-Token': apiKey,
      Accept: 'application/json',
    },
    fetch: fetchImpl,
    label: 'Plex sessions',
  })
  return formatPlexGlance(countPlexStreams(body))
}

export const plexAdapter = apiKeyAdapter('plex', fetchPlexGlance)
