function apiBase(serviceUrl: string): string {
  return serviceUrl.replace(/\/$/, '')
}

export function integrationBase(serviceUrl: string): string {
  return `${apiBase(serviceUrl)}/proxy/network/integration/v1`
}

export function sitesUrl(serviceUrl: string): string {
  return `${integrationBase(serviceUrl)}/sites`
}

export function clientsUrl(serviceUrl: string, siteId: string): string {
  return `${integrationBase(serviceUrl)}/sites/${encodeURIComponent(siteId)}/clients`
}

type UniFiSite = {
  id?: string
  name?: string
  internalReference?: string
}

type UniFiSitesResponse = {
  data?: UniFiSite[]
  sites?: UniFiSite[]
}

type UniFiClient = Record<string, unknown>

type UniFiClientsResponse = {
  data?: UniFiClient[]
  clients?: UniFiClient[]
  totalCount?: number
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    'X-API-KEY': apiKey,
    Accept: 'application/json',
  }
}

function unwrapList<T>(body: { data?: T[] } & Record<string, unknown>, key?: string): T[] {
  if (Array.isArray(body.data)) return body.data
  if (key && Array.isArray(body[key])) return body[key] as T[]
  if (Array.isArray(body)) return body as T[]
  return []
}

export function pickSiteId(sites: UniFiSite[]): string {
  const preferred =
    sites.find((site) => site.internalReference === 'default') ??
    sites.find((site) => site.name === 'default') ??
    sites[0]

  if (!preferred?.id) {
    throw new Error('UniFi sites response missing site id')
  }

  return preferred.id
}

export function formatUniFiGlance(clientCount: number): string {
  return `${clientCount} clients`
}

export function countClients(body: UniFiClientsResponse): number {
  if (typeof body.totalCount === 'number') return body.totalCount
  return unwrapList<UniFiClient>(body, 'clients').length
}

export async function fetchUniFiGlance(
  serviceUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const sitesResponse = await fetchImpl(sitesUrl(serviceUrl), {
    headers: authHeaders(apiKey),
  })

  if (!sitesResponse.ok) {
    throw new Error(`UniFi sites failed: ${sitesResponse.status}`)
  }

  const sitesBody = (await sitesResponse.json()) as UniFiSitesResponse
  const sites = unwrapList<UniFiSite>(sitesBody, 'sites')
  const siteId = pickSiteId(sites)

  const clientsResponse = await fetchImpl(clientsUrl(serviceUrl, siteId), {
    headers: authHeaders(apiKey),
  })

  if (!clientsResponse.ok) {
    throw new Error(`UniFi clients failed: ${clientsResponse.status}`)
  }

  const clientsBody = (await clientsResponse.json()) as UniFiClientsResponse
  return formatUniFiGlance(countClients(clientsBody))
}
