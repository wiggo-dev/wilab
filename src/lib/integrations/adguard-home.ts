import { apiKeyAdapter } from './adapter'
import { getJson, trimBase } from './upstream-request'

export function statsUrl(serviceUrl: string): string {
  return `${trimBase(serviceUrl)}/control/stats`
}

type AdGuardStats = {
  num_blocked_filtering?: number
}

export function formatAdGuardGlance(blocked: number): string {
  return `${blocked} blocked`
}

function requestHeaders(apiKey: string): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const trimmed = apiKey.trim()
  if (trimmed.includes(':')) {
    headers.Authorization = `Basic ${Buffer.from(trimmed, 'utf8').toString('base64')}`
  }
  return headers
}

export async function fetchAdGuardGlance(
  serviceUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const stats = await getJson<AdGuardStats>(statsUrl(serviceUrl), {
    headers: requestHeaders(apiKey),
    fetch: fetchImpl,
    label: 'AdGuard Home stats',
  })
  return formatAdGuardGlance(stats.num_blocked_filtering ?? 0)
}

export const adGuardHomeAdapter = apiKeyAdapter('adguard-home', fetchAdGuardGlance)
