'use client'

import { useEffect, useState } from 'react'
import type { GlanceResult } from '@/lib/integrations/types'

const POLL_INTERVAL_MS = 30_000

export function useLiveGlances() {
  const [glances, setGlances] = useState<Record<string, GlanceResult>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/live')
        if (!response.ok) return
        const body = (await response.json()) as { services: Record<string, GlanceResult> }
        if (!cancelled) {
          setGlances(body.services)
          setLoaded(true)
        }
      } catch {
        // keep last known glances
      }
    }

    void load()
    const timer = setInterval(load, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return { glances, loaded }
}
