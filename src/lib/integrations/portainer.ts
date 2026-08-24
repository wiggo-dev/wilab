import { apiKeyAdapter } from './adapter'
import { getJson, trimBase } from './upstream-request'

export function endpointsUrl(serviceUrl: string): string {
  return `${trimBase(serviceUrl)}/api/endpoints`
}

export function containersUrl(serviceUrl: string, endpointId: number): string {
  return `${trimBase(serviceUrl)}/api/endpoints/${endpointId}/docker/containers/json?all=true`
}

type DockerSnapshot = {
  RunningContainerCount?: number
  ContainerCount?: number
  UnhealthyContainerCount?: number
}

type DockerContainer = {
  State?: string
  Health?: { Status?: string }
}

export type PortainerEndpoint = {
  Id?: number
  Snapshots?: DockerSnapshot[]
}

export function sumPortainerSnapshots(endpoints: PortainerEndpoint[]): {
  running: number
  total: number
  unhealthy: number
} {
  let running = 0
  let total = 0
  let unhealthy = 0

  for (const endpoint of endpoints) {
    const snapshots = endpoint.Snapshots ?? []
    const snapshot = snapshots.at(-1)
    if (!snapshot) continue

    running += snapshot.RunningContainerCount ?? 0
    total += snapshot.ContainerCount ?? 0
    unhealthy += snapshot.UnhealthyContainerCount ?? 0
  }

  return { running, total, unhealthy }
}

export function countDockerContainers(containers: DockerContainer[]): {
  running: number
  total: number
  unhealthy: number
} {
  let running = 0
  let unhealthy = 0

  for (const container of containers) {
    if (container.State === 'running') running += 1
    if (container.Health?.Status === 'unhealthy') unhealthy += 1
  }

  return { running, total: containers.length, unhealthy }
}

export function formatPortainerGlance(counts: {
  running: number
  total: number
  unhealthy: number
}): string {
  if (counts.unhealthy > 0) return `${counts.unhealthy} unhealthy`
  return `${counts.running}/${counts.total} running`
}

async function fetchEndpointContainers(
  serviceUrl: string,
  apiKey: string,
  endpointId: number,
  fetchImpl: typeof fetch,
): Promise<DockerContainer[]> {
  return getJson<DockerContainer[]>(containersUrl(serviceUrl, endpointId), {
    headers: { 'X-API-Key': apiKey },
    fetch: fetchImpl,
    label: 'Portainer containers',
  })
}

async function sumContainersAcrossEndpoints(
  serviceUrl: string,
  apiKey: string,
  endpoints: PortainerEndpoint[],
  fetchImpl: typeof fetch,
): Promise<{ running: number; total: number; unhealthy: number }> {
  let running = 0
  let total = 0
  let unhealthy = 0

  for (const endpoint of endpoints) {
    if (endpoint.Id == null) continue

    const containers = await fetchEndpointContainers(serviceUrl, apiKey, endpoint.Id, fetchImpl)
    const counts = countDockerContainers(containers)
    running += counts.running
    total += counts.total
    unhealthy += counts.unhealthy
  }

  return { running, total, unhealthy }
}

export async function fetchPortainerGlance(
  serviceUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const endpoints = await getJson<PortainerEndpoint[]>(endpointsUrl(serviceUrl), {
    headers: { 'X-API-Key': apiKey },
    fetch: fetchImpl,
    label: 'Portainer endpoints',
  })
  let counts = sumPortainerSnapshots(endpoints)

  if (counts.total === 0 && counts.running === 0 && counts.unhealthy === 0) {
    const hasEndpointIds = endpoints.some((endpoint) => endpoint.Id != null)
    if (hasEndpointIds) {
      counts = await sumContainersAcrossEndpoints(serviceUrl, apiKey, endpoints, fetchImpl)
    }
  }

  return formatPortainerGlance(counts)
}

export const portainerAdapter = apiKeyAdapter('portainer', fetchPortainerGlance)
