import type { Service } from '@/lib/config/types'
import { fetchGlance, isSupportedIntegration } from './registry'
import type { ServiceIntegration } from './types'
import { UPSTREAM_TIMEOUT_MS } from './types'
import { upstreamFetch } from './upstream-fetch'

export type IntegrationTestResult =
  | { ok: true; text: string }
  | { ok: false; error: string }

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timed out')), timeoutMs)
    }),
  ])
}

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
    const text = await withTimeout(
      fetchGlance(service, integration, fetchImpl),
      UPSTREAM_TIMEOUT_MS,
    )
    return { ok: true, text }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}
