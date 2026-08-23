import type { Service, WilabConfig } from '@/lib/config/types'
import { fetchGlance, isSupportedIntegration } from './registry'
import type { GlanceResult, LiveResponse } from './types'
import {
  LIVE_COALESCE_MS,
  STALE_THRESHOLD_MS,
  UPSTREAM_TIMEOUT_MS,
} from './types'
import { upstreamFetch } from './upstream-fetch'
import { withUpstreamTimeout } from './upstream-timeout'

type LastGood = {
  text: string
  fetchedAt: number
}

export type GlanceEngineOptions = {
  fetch?: typeof fetch
  now?: () => number
  coalesceMs?: number
  staleMs?: number
  timeoutMs?: number
}

export class GlanceEngine {
  private readonly fetchImpl: typeof fetch
  private readonly now: () => number
  private readonly coalesceMs: number
  private readonly staleMs: number
  private readonly timeoutMs: number
  private readonly lastGoodByService = new Map<string, LastGood>()
  private cachedLive: { fetchedAt: number; response: LiveResponse } | null = null

  constructor(options: GlanceEngineOptions = {}) {
    this.fetchImpl = options.fetch ?? fetch
    this.now = options.now ?? Date.now
    this.coalesceMs = options.coalesceMs ?? LIVE_COALESCE_MS
    this.staleMs = options.staleMs ?? STALE_THRESHOLD_MS
    this.timeoutMs = options.timeoutMs ?? UPSTREAM_TIMEOUT_MS
  }

  async get(config: WilabConfig): Promise<LiveResponse> {
    const now = this.now()
    if (this.cachedLive && now - this.cachedLive.fetchedAt < this.coalesceMs) {
      return this.applyStaleAging(this.cachedLive.response, now)
    }

    const response = await this.aggregate(config)
    this.cachedLive = { fetchedAt: now, response }
    return response
  }

  async aggregate(config: WilabConfig): Promise<LiveResponse> {
    const now = this.now()
    const integrated = config.services.filter((service) => isSupportedIntegration(service.integration))
    const results = await Promise.all(
      integrated.map(async (service) => {
        const text = await this.fetchServiceGlance(service)
        return [service.id, this.classify(service.id, text, now)] as const
      }),
    )

    return {
      services: Object.fromEntries(results),
    }
  }

  private async fetchServiceGlance(service: Service): Promise<string | null> {
    if (!isSupportedIntegration(service.integration)) return null

    try {
      return await withUpstreamTimeout(
        fetchGlance(service, service.integration, this.fetchImpl),
        this.timeoutMs,
      )
    } catch {
      return null
    }
  }

  private classify(serviceId: string, text: string | null, now: number): GlanceResult {
    if (text) {
      this.lastGoodByService.set(serviceId, { text, fetchedAt: now })
      return { status: 'healthy', text }
    }

    const previous = this.lastGoodByService.get(serviceId)
    if (previous) {
      return { status: 'stale', text: previous.text }
    }

    return { status: 'unavailable', text: 'Unavailable' }
  }

  private applyStaleAging(response: LiveResponse, now: number): LiveResponse {
    const services: LiveResponse['services'] = {}

    for (const [serviceId, glance] of Object.entries(response.services)) {
      if (glance.status !== 'healthy') {
        services[serviceId] = glance
        continue
      }

      const previous = this.lastGoodByService.get(serviceId)
      if (previous && now - previous.fetchedAt >= this.staleMs) {
        services[serviceId] = { status: 'stale', text: previous.text }
      } else {
        services[serviceId] = glance
      }
    }

    return { services }
  }
}

let defaultEngine: GlanceEngine | null = null

export function getGlanceEngine(): GlanceEngine {
  defaultEngine ??= new GlanceEngine({ fetch: upstreamFetch })
  return defaultEngine
}

/** Clears the process singleton — used by tests that re-import the live route. */
export function resetGlanceEngine() {
  defaultEngine = null
}
