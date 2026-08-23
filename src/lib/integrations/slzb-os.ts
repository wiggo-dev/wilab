import { apiKeyAdapter } from './adapter'

function apiBase(serviceUrl: string): string {
  return serviceUrl.replace(/\/$/, '')
}

export function haSensorsUrl(serviceUrl: string): string {
  return `${apiBase(serviceUrl)}/ha_sensors`
}

export type SlzbSensors = {
  zb_temp?: number
  zb_temp2?: string | number
}

export function parseZbTemp(sensors: SlzbSensors): number | null {
  if (typeof sensors.zb_temp === 'number' && !Number.isNaN(sensors.zb_temp)) {
    return sensors.zb_temp
  }

  if (sensors.zb_temp2 != null) {
    const parsed = typeof sensors.zb_temp2 === 'number' ? sensors.zb_temp2 : Number(sensors.zb_temp2)
    if (!Number.isNaN(parsed)) return parsed
  }

  return null
}

export function formatSlzbOsGlance(sensors: SlzbSensors): string {
  const temp = parseZbTemp(sensors)
  if (temp != null) {
    const rounded = Math.round(temp * 10) / 10
    return `${rounded}°C`
  }
  return 'Online'
}

function requestHeaders(apiKey: string): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (apiKey.includes(':')) {
    headers.Authorization = `Basic ${Buffer.from(apiKey, 'utf8').toString('base64')}`
  }
  return headers
}

export async function fetchSlzbOsGlance(
  serviceUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchImpl(haSensorsUrl(serviceUrl), {
    headers: requestHeaders(apiKey),
  })

  if (!response.ok) {
    throw new Error(`SLZB-OS sensors failed: ${response.status}`)
  }

  const sensors = (await response.json()) as SlzbSensors
  return formatSlzbOsGlance(sensors)
}

export const slzbOsAdapter = apiKeyAdapter('slzb-os', fetchSlzbOsGlance)
