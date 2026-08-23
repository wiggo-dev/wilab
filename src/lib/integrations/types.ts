export type GlanceStatus = 'healthy' | 'stale' | 'unavailable'

export type GlanceResult = {
  status: GlanceStatus
  text: string
}

export type ApiKeyIntegration = {
  kind: string
  apiKey: string
}

export type QnapIntegration = {
  kind: 'qnap'
  username: string
  password: string
}

export type ServiceIntegration = ApiKeyIntegration | QnapIntegration

export function isQnapIntegration(integration: ServiceIntegration): integration is QnapIntegration {
  return integration.kind === 'qnap'
}

export type LiveResponse = {
  services: Record<string, GlanceResult>
}

export const UPSTREAM_TIMEOUT_MS = 5_000
export const LIVE_COALESCE_MS = 30_000
export const STALE_THRESHOLD_MS = 90_000
