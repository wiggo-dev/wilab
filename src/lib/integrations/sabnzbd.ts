function apiBase(serviceUrl: string): string {
  return serviceUrl.replace(/\/$/, '')
}

export function queueApiUrl(serviceUrl: string, apiKey: string): string {
  const params = new URLSearchParams({
    mode: 'queue',
    output: 'json',
    apikey: apiKey,
  })
  return `${apiBase(serviceUrl)}/api?${params}`
}

export type SabnzbdQueueState = {
  paused: boolean
  status: string
  kbpersec: string
}

export function parseSabnzbdQueue(body: { queue?: Partial<SabnzbdQueueState> }): SabnzbdQueueState {
  const queue = body.queue ?? {}
  return {
    paused: queue.paused ?? false,
    status: queue.status ?? 'Idle',
    kbpersec: queue.kbpersec ?? '0',
  }
}

export function formatSabnzbdGlance(state: SabnzbdQueueState): string {
  if (state.paused) return 'Paused'

  const kb = Number(state.kbpersec)
  if (state.status === 'Downloading' || (Number.isFinite(kb) && kb > 0)) {
    if (!Number.isFinite(kb) || kb <= 0) return '0 KB/s'
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB/s`
    return `${Math.round(kb)} KB/s`
  }

  return 'Idle'
}

export async function fetchSabnzbdGlance(
  serviceUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchImpl(queueApiUrl(serviceUrl, apiKey))

  if (!response.ok) {
    throw new Error(`SABnzbd queue failed: ${response.status}`)
  }

  const body = (await response.json()) as { queue?: Partial<SabnzbdQueueState> }
  return formatSabnzbdGlance(parseSabnzbdQueue(body))
}
