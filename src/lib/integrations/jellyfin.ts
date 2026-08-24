import { apiKeyAdapter } from './adapter'
import { getJson, trimBase } from './upstream-request'

export function sessionsUrl(serviceUrl: string): string {
  return `${trimBase(serviceUrl)}/Sessions`
}

type JellyfinSession = {
  NowPlayingItem?: unknown
}

export function countPlayingSessions(sessions: JellyfinSession[]): number {
  return sessions.filter((session) => session.NowPlayingItem != null).length
}

export function formatJellyfinGlance(playing: number): string {
  return `${playing} playing`
}

function jellyfinAuthHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `MediaBrowser Client="wilab", Device="wilab", DeviceId="wilab", Version="1.0.0", Token="${apiKey}"`,
    Accept: 'application/json',
  }
}

export async function fetchJellyfinGlance(
  serviceUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const sessions = await getJson<JellyfinSession[]>(sessionsUrl(serviceUrl), {
    headers: jellyfinAuthHeaders(apiKey),
    fetch: fetchImpl,
    label: 'Jellyfin sessions',
  })
  return formatJellyfinGlance(countPlayingSessions(sessions))
}

export const jellyfinAdapter = apiKeyAdapter('jellyfin', fetchJellyfinGlance)
