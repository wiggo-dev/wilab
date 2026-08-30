'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CONFIG_FLUSH_DEBOUNCE_MS, persistConfig } from '@/lib/config/persist'
import type { WilabConfig } from '@/lib/config/types'
import { resolveConfigForDisplay } from '@/lib/landing/resolve-services'

export type ConfigUpdater = (config: WilabConfig) => WilabConfig

export type ApplyOptions = {
  debounce?: boolean
}

export function useConfigSession(initialConfig: WilabConfig) {
  const [config, setConfig] = useState(initialConfig)
  const [editMode, setEditMode] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const configRef = useRef(config)

  useEffect(() => {
    configRef.current = config
  }, [config])

  const displayConfig = useMemo(() => resolveConfigForDisplay(config), [config])

  const flushImmediate = useCallback(async (next: WilabConfig) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    setConfig(next)
    await persistConfig(next)
  }, [])

  const flushDebounced = useCallback((next: WilabConfig) => {
    setConfig(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      void persistConfig(next)
    }, CONFIG_FLUSH_DEBOUNCE_MS)
  }, [])

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    },
    [],
  )

  const apply = useCallback(
    async (updater: ConfigUpdater, options?: ApplyOptions) => {
      const next = updater(configRef.current)
      if (options?.debounce) {
        flushDebounced(next)
      } else {
        await flushImmediate(next)
      }
    },
    [flushDebounced, flushImmediate],
  )

  return {
    config,
    displayConfig,
    editMode,
    setEditMode,
    apply,
  }
}
