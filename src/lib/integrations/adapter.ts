import type { Service } from '@/lib/config/types'
import type { ServiceIntegration } from './types'
import { isApiKeyIntegration } from './types'

export type IntegrationAdapter = {
  kind: string
  createDefault(): ServiceIntegration
  fetchGlance(
    service: Service,
    integration: ServiceIntegration,
    fetchImpl: typeof fetch,
  ): Promise<string>
}

export function createApiKeyIntegration(kind: string): ServiceIntegration {
  return { kind, apiKey: '' }
}

export function apiKeyAdapter(
  kind: string,
  fetchFn: (serviceUrl: string, apiKey: string, fetchImpl: typeof fetch) => Promise<string>,
): IntegrationAdapter {
  return {
    kind,
    createDefault: () => createApiKeyIntegration(kind),
    fetchGlance: (service, integration, fetchImpl) => {
      if (!isApiKeyIntegration(integration)) {
        throw new Error(`Integration kind ${kind} requires an API key`)
      }
      return fetchFn(service.url, integration.apiKey, fetchImpl)
    },
  }
}
