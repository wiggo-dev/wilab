'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CatalogEntry } from '@/lib/catalog/types'
import {
  addSearchProvider,
  addService,
  addServiceFromCatalog,
  createCustomService,
  removeService,
  reorderGrid,
  reorderPinned,
  setActiveSearchProvider,
  togglePin,
  updateSearchProvider,
  updateService,
} from '@/lib/config/mutations'
import { CONFIG_FLUSH_DEBOUNCE_MS, persistConfig } from '@/lib/config/persist'
import type { SearchProvider, Service, WilabConfig } from '@/lib/config/types'
import { resolveConfigForDisplay } from '@/lib/landing/resolve-services'

export function useWilabConfig(initialConfig: WilabConfig) {
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

  const addFromCatalog = useCallback(
    async (entry: CatalogEntry) => {
      const id = crypto.randomUUID()
      const { config: next, serviceId } = addServiceFromCatalog(configRef.current, entry, id)
      await flushImmediate(next)
      return serviceId
    },
    [flushImmediate],
  )

  const saveNewService = useCallback(
    async (service: Service) => {
      await flushImmediate(addService(configRef.current, service))
    },
    [flushImmediate],
  )

  const saveCustomService = useCallback(
    async (input: { name: string; url: string; logo: string; tags: string[] }) => {
      const service = createCustomService({
        id: crypto.randomUUID(),
        ...input,
      })
      await flushImmediate(addService(configRef.current, service))
    },
    [flushImmediate],
  )

  const saveService = useCallback(
    async (id: string, patch: Partial<Pick<Service, 'name' | 'url' | 'logo' | 'tags' | 'integration'>>) => {
      await flushImmediate(updateService(configRef.current, id, patch))
    },
    [flushImmediate],
  )

  const deleteService = useCallback(
    async (id: string) => {
      await flushImmediate(removeService(configRef.current, id))
    },
    [flushImmediate],
  )

  const pinService = useCallback(
    async (id: string) => {
      await flushImmediate(togglePin(configRef.current, id))
    },
    [flushImmediate],
  )

  const dragReorderGrid = useCallback(
    (id: string, beforeId: string | null) => {
      flushDebounced(reorderGrid(configRef.current, id, beforeId))
    },
    [flushDebounced],
  )

  const dragReorderPinned = useCallback(
    (id: string, beforeId: string | null) => {
      flushDebounced(reorderPinned(configRef.current, id, beforeId))
    },
    [flushDebounced],
  )

  const changeActiveSearchProvider = useCallback(
    async (id: string) => {
      await flushImmediate(setActiveSearchProvider(configRef.current, id))
    },
    [flushImmediate],
  )

  const saveSearchProvider = useCallback(
    async (id: string, patch: Partial<Pick<SearchProvider, 'name' | 'template'>>) => {
      await flushImmediate(updateSearchProvider(configRef.current, id, patch))
    },
    [flushImmediate],
  )

  const createSearchProvider = useCallback(
    async (provider: SearchProvider) => {
      await flushImmediate(addSearchProvider(configRef.current, provider))
    },
    [flushImmediate],
  )

  return {
    config: displayConfig,
    rawConfig: config,
    editMode,
    setEditMode,
    addFromCatalog,
    saveNewService,
    saveCustomService,
    saveService,
    deleteService,
    pinService,
    dragReorderGrid,
    dragReorderPinned,
    changeActiveSearchProvider,
    saveSearchProvider,
    createSearchProvider,
  }
}
