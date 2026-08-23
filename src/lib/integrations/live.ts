import type { Service, WilabConfig } from '@/lib/config/types'
import { fetchGlance, isSupportedIntegration } from './registry'
import type { GlanceResult, LiveResponse } from './types'
import {
  LIVE_COALESCE_MS,
  STALE_THRESHOLD_MS,
  UPSTREAM_TIMEOUT_MS,
} from './types'

type LastGood = {
  text: string
  fetchedAt: number
}

const lastGoodByService = new Map<string, LastGood>()
let cachedLive: { fetchedAt: number; response: LiveResponse } | null = null

export function resetLiveState() {
  lastGoodByService.clear()
  cachedLive = null
}

function classify(serviceId: string, text: string | null, now: number): GlanceResult {
  if (text) {
    lastGoodByService.set(serviceId, { text, fetchedAt: now })
    return { status: 'healthy', text }
  }

  const previous = lastGoodByService.get(serviceId)
  if (previous) {
    return { status: 'stale', text: previous.text }
  }

  return { status: 'unavailable', text: 'Unavailable' }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), timeoutMs)
    }),
  ])
}

async function fetchServiceGlance(service: Service, fetchImpl: typeof fetch): Promise<string | null> {
  if (!isSupportedIntegration(service.integration)) return null

  try {
    return await withTimeout(fetchGlance(service, service.integration, fetchImpl), UPSTREAM_TIMEOUT_MS)
  } catch {
    return null
  }
}

export async function aggregateLiveGlances(
  config: WilabConfig,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<LiveResponse> {
  const integrated = config.services.filter((service) => isSupportedIntegration(service.integration))
  const results = await Promise.all(
    integrated.map(async (service) => {
      const text = await fetchServiceGlance(service, fetchImpl)
      return [service.id, classify(service.id, text, now)] as const
    }),
  )

  return {
    services: Object.fromEntries(results),
  }
}

export async function getLiveGlances(
  config: WilabConfig,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<LiveResponse> {
  if (cachedLive && now - cachedLive.fetchedAt < LIVE_COALESCE_MS) {
    return applyStaleAging(cachedLive.response, now)
  }

  const response = await aggregateLiveGlances(config, fetchImpl, now)
  cachedLive = { fetchedAt: now, response }
  return response
}

export function applyStaleAging(response: LiveResponse, now: number): LiveResponse {
  const services: LiveResponse['services'] = {}

  for (const [serviceId, glance] of Object.entries(response.services)) {
    if (glance.status !== 'healthy') {
      services[serviceId] = glance
      continue
    }

    const previous = lastGoodByService.get(serviceId)
    if (previous && now - previous.fetchedAt >= STALE_THRESHOLD_MS) {
      services[serviceId] = { status: 'stale', text: previous.text }
    } else {
      services[serviceId] = glance
    }
  }

  return { services }
}
