import type { WilabConfig } from '@/lib/config/types'

export async function persistConfig(config: WilabConfig): Promise<void> {
  const response = await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })

  if (!response.ok) {
    throw new Error(`Failed to persist config: ${response.status}`)
  }
}

export const CONFIG_FLUSH_DEBOUNCE_MS = 300
