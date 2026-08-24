import { apiKeyAdapter } from './adapter'
import { getJson, trimBase } from './upstream-request'

export function statesUrl(serviceUrl: string): string {
  return `${trimBase(serviceUrl)}/api/states`
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
  const states = await getJson<HomeAssistantState[]>(statesUrl(serviceUrl), {
    headers: { Authorization: `Bearer ${apiKey}` },
    fetch: fetchImpl,
    label: 'Home Assistant states',
  })
  return formatHomeAssistantGlance(countLightsOn(states))
}

export const homeAssistantAdapter = apiKeyAdapter('home-assistant', fetchHomeAssistantGlance)
