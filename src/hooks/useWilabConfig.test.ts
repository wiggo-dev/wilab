/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FIXTURE_CONFIG } from '@/lib/landing/fixtures'
import { CONFIG_FLUSH_DEBOUNCE_MS } from '@/lib/config/persist'
import { useWilabConfig } from './useWilabConfig'

describe('useWilabConfig', () => {
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

  it('flushes pin changes immediately', async () => {
    const { result } = renderHook(() => useWilabConfig(FIXTURE_CONFIG))

    await act(async () => {
      await result.current.pinService('svc-sonarr')
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body.pinnedOrder).toContain('svc-sonarr')
  })

  it('debounces drag reorder saves', async () => {
    const { result } = renderHook(() => useWilabConfig(FIXTURE_CONFIG))

    act(() => {
      result.current.dragReorderGrid('svc-infra', 'svc-ha')
    })

    expect(fetchMock).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(CONFIG_FLUSH_DEBOUNCE_MS)
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body.gridOrder[0]).toBe('svc-infra')
  })
})
