import { apiKeyAdapter } from './adapter'

function apiBase(serviceUrl: string): string {
  return serviceUrl.replace(/\/$/, '')
}

export function statesUrl(serviceUrl: string): string {
  return `${apiBase(serviceUrl)}/api/states`
}

type HomeAssistantState = {
  entity_id: string
  state: string
}

export function countLightsOn(states: HomeAssistantState[]): number {
  return states.filter(
    (entity) => entity.entity_id.startsWith('light.') && entity.state === 'on',
  ).length
}

export function formatHomeAssistantGlance(lightsOn: number): string {
  return `${lightsOn} lights on`
}

export async function fetchHomeAssistantGlance(
  serviceUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchImpl(statesUrl(serviceUrl), {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!response.ok) {
    throw new Error(`Home Assistant states failed: ${response.status}`)
  }

  const states = (await response.json()) as HomeAssistantState[]
  return formatHomeAssistantGlance(countLightsOn(states))
}

export const homeAssistantAdapter = apiKeyAdapter('home-assistant', fetchHomeAssistantGlance)
