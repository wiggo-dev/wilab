/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultConfig } from '@/lib/config/defaults'
import { togglePin, reorderGrid } from '@/lib/config/mutations'
import { CONFIG_FLUSH_DEBOUNCE_MS } from '@/lib/config/persist'
import { FIXTURE_CONFIG } from '@/lib/landing/fixtures'
import { useConfigSession } from './useConfigSession'

describe('useConfigSession', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    fetchMock.mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('flushes immediate apply changes right away', async () => {
    const { result } = renderHook(() => useConfigSession(FIXTURE_CONFIG))

    await act(async () => {
      await result.current.apply((config) => togglePin(config, 'svc-sonarr'))
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body.pinnedOrder).toContain('svc-sonarr')
  })

  it('debounces apply when debounce is requested', async () => {
    const { result } = renderHook(() => useConfigSession(FIXTURE_CONFIG))

    act(() => {
      void result.current.apply(
        (config) => reorderGrid(config, 'svc-infra', 'svc-ha'),
        { debounce: true },
      )
    })

    expect(fetchMock).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(CONFIG_FLUSH_DEBOUNCE_MS)
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body.gridOrder[0]).toBe('svc-infra')
  })

  it('apply replaces config immediately when given a full config', async () => {
    const incoming = createDefaultConfig()
    incoming.services = [
      {
        id: 'imported',
        catalogId: null,
        name: 'Imported',
        url: 'http://imported',
        logo: '',
        tags: [],
        integration: null,
      },
    ]
    incoming.gridOrder = ['imported']

    const { result } = renderHook(() => useConfigSession(FIXTURE_CONFIG))

    await act(async () => {
      await result.current.apply(() => incoming)
    })

    expect(result.current.config.services).toHaveLength(1)
    expect(result.current.config.services[0]?.id).toBe('imported')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body.services).toHaveLength(1)
    expect(body.services[0].id).toBe('imported')
  })
})
