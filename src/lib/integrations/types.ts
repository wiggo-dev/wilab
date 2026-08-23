export type GlanceStatus = 'healthy' | 'stale' | 'unavailable'

export type GlanceResult = {
  status: GlanceStatus
  text: string
}

export type ServiceIntegration = {
  kind: string
  apiKey: string
}

export type LiveResponse = {
  services: Record<string, GlanceResult>
}

export const UPSTREAM_TIMEOUT_MS = 5_000
export const LIVE_COALESCE_MS = 30_000
export const STALE_THRESHOLD_MS = 90_000
