export function metricsUrl(serviceUrl: string): string {
  return `${serviceUrl.replace(/\/$/, '')}/metrics`
}

export function parseUptimeKumaMetrics(body: string): { up: number; total: number } {
  const statuses = new Map<string, number>()

  for (const line of body.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('monitor_status{')) continue

    const match = trimmed.match(/^monitor_status\{[^}]*monitor_id="([^"]+)"[^}]*\}\s+(-?\d+(?:\.\d+)?)/)
    if (!match) continue

    statuses.set(match[1], Number(match[2]))
  }

  let up = 0
  for (const status of statuses.values()) {
    if (status === 1) up += 1
  }

  return { up, total: statuses.size }
}

export function formatUptimeKumaGlance(counts: { up: number; total: number }): string {
  return `${counts.up}/${counts.total} up`
}

export async function fetchUptimeKumaGlance(
  serviceUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchImpl(metricsUrl(serviceUrl), {
    headers: {
      Authorization: `Basic ${Buffer.from(`:${apiKey}`).toString('base64')}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Uptime Kuma metrics failed: ${response.status}`)
  }

  const body = await response.text()
  return formatUptimeKumaGlance(parseUptimeKumaMetrics(body))
}
