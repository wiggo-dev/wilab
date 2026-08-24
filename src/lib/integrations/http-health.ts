import type { IntegrationAdapter } from './adapter'
import { isHttpHealthIntegration } from './types'

export function healthCheckUrl(serviceUrl: string, path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return serviceUrl

  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const url = new URL(serviceUrl)
  return `${url.origin}${normalized}`
}

export function formatHttpHealthGlance(status: number): string {
  return status >= 200 && status < 300 ? 'Up' : String(status)
}

export async function fetchHttpHealthGlance(
  serviceUrl: string,
  path: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchImpl(healthCheckUrl(serviceUrl, path), { method: 'GET' })
  return formatHttpHealthGlance(response.status)
}

export const httpHealthAdapter: IntegrationAdapter = {
  kind: 'http-health',
  createDefault: () => ({ kind: 'http-health', path: '' }),
  fetchGlance: (service, integration, fetchImpl) => {
    if (!isHttpHealthIntegration(integration)) {
      throw new Error('HTTP health integration requires a path field')
    }
    return fetchHttpHealthGlance(service.url, integration.path, fetchImpl)
  },
}
