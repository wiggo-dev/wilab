import type { Service } from '@/lib/config/types'
import { fetchGlance, isSupportedIntegration } from './registry'
import type { ServiceIntegration } from './types'
import { UPSTREAM_TIMEOUT_MS } from './types'
import { upstreamFetch } from './upstream-fetch'
import { withUpstreamTimeout } from './upstream-timeout'

export type IntegrationTestResult =
  | { ok: true; text: string }
  | { ok: false; error: string }

export async function testIntegrationConnection(
  url: string,
  integration: ServiceIntegration,
  fetchImpl: typeof fetch = upstreamFetch,
): Promise<IntegrationTestResult> {
  if (!isSupportedIntegration(integration)) {
    return { ok: false, error: 'Unsupported integration kind' }
  }

  const service: Service = {
    id: 'integration-test',
    catalogId: null,
    name: 'Integration test',
    url,
    logo: '',
    tags: [],
    integration,
  }

  try {
    const text = await withUpstreamTimeout(
      fetchGlance(service, integration, fetchImpl),
      UPSTREAM_TIMEOUT_MS,
      'Connection timed out',
    )
    return { ok: true, text }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}
