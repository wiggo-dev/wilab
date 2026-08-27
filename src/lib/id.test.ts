import { afterEach, describe, expect, it, vi } from 'vitest'
import { createId } from './id'

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('createId', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns a UUID when crypto.randomUUID is available', () => {
    expect(createId()).toMatch(UUID_V4)
  })

  it('falls back when crypto.randomUUID is missing (non-secure HTTP)', () => {
    const getRandomValues = vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = i
      return arr
    })
    vi.stubGlobal('crypto', { getRandomValues })

    // Same symptom as the browser console on HTTP LAN installs
    expect(() => (crypto as Crypto).randomUUID()).toThrowError(
      /crypto\.randomUUID is not a function/,
    )

    expect(createId()).toMatch(UUID_V4)
    expect(getRandomValues).toHaveBeenCalledOnce()
  })
})
