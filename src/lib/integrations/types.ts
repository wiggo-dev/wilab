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

export type HttpHealthIntegration = {
  kind: 'http-health'
  path: string
}

export type ServiceIntegration = ApiKeyIntegration | QnapIntegration | HttpHealthIntegration

export function isQnapIntegration(integration: ServiceIntegration): integration is QnapIntegration {
  return integration.kind === 'qnap'
}

export function isHttpHealthIntegration(
  integration: ServiceIntegration,
): integration is HttpHealthIntegration {
  return integration.kind === 'http-health'
}

export function isApiKeyIntegration(
  integration: ServiceIntegration,
): integration is ApiKeyIntegration {
  return !isQnapIntegration(integration) && !isHttpHealthIntegration(integration)
}

export type LiveResponse = {
  services: Record<string, GlanceResult>
}

export const UPSTREAM_TIMEOUT_MS = 5_000
export const LIVE_COALESCE_MS = 30_000
export const STALE_THRESHOLD_MS = 90_000
