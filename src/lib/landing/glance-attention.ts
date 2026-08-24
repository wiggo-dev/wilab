import type { GlanceResult } from '@/lib/integrations/types'

export type GlanceAttention = 'ok' | 'warn' | 'error'

const RATIO =
  /^(\d+)\s*\/\s*(\d+)\s+(up|cameras|running|indexers)\b/i
const OF_ONLINE = /^(\d+)\s+of\s+(\d+)\s+online\b/i

function partialRatio(numerator: number, denominator: number): boolean {
  return denominator > 0 && numerator < denominator
}

/**
 * Client-side attention for tile styling from glance status + text.
 * Does not change glance strings.
 */
export function classifyGlanceAttention(
  glance: Pick<GlanceResult, 'status' | 'text'>,
): GlanceAttention {
  if (glance.status === 'unavailable') return 'error'

  const text = glance.text.trim()

  if (/^\d{3}$/.test(text)) return 'error'

  if (/\bunhealthy\b/i.test(text) || /\bmissing\b/i.test(text)) return 'warn'

  const slash = text.match(RATIO)
  if (slash && partialRatio(Number(slash[1]), Number(slash[2]))) return 'warn'

  const ofOnline = text.match(OF_ONLINE)
  if (ofOnline && partialRatio(Number(ofOnline[1]), Number(ofOnline[2]))) return 'warn'

  return 'ok'
}
