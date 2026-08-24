import { apiKeyAdapter } from './adapter'
import { getJson, trimBase } from './upstream-request'

export function statsUrl(serviceUrl: string): string {
  return `${trimBase(serviceUrl)}/api/stats`
}

type FrigateCameraStats = {
  camera_fps?: number
}

type FrigateStats = {
  cameras?: Record<string, FrigateCameraStats>
}

export function countCameras(stats: FrigateStats): { online: number; total: number } {
  const cameras = Object.values(stats.cameras ?? {})
  const online = cameras.filter((camera) => (camera.camera_fps ?? 0) > 0).length
  return { online, total: cameras.length }
}

export function formatFrigateGlance(counts: { online: number; total: number }): string {
  return `${counts.online}/${counts.total} cameras`
}

export async function fetchFrigateGlance(
  serviceUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (apiKey.trim()) {
    headers.Authorization = `Bearer ${apiKey.trim()}`
  }

  const stats = await getJson<FrigateStats>(statsUrl(serviceUrl), {
    headers,
    fetch: fetchImpl,
    label: 'Frigate stats',
  })
  return formatFrigateGlance(countCameras(stats))
}

export const frigateAdapter = apiKeyAdapter('frigate', fetchFrigateGlance)
