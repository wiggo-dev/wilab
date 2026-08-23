import { describe, expect, it } from 'vitest'
import { DEFAULT_SEARCH_PROVIDERS } from './defaults'
import { normalizeWilabConfig } from './normalize'
import type { WilabConfig } from './types'

const base: WilabConfig = {
  schemaVersion: 1,
  services: [
    {
      id: 'a',
      catalogId: null,
      name: 'A',
      url: 'http://a',
      logo: '',
      tags: [],
      integration: null,
    },
    {
      id: 'b',
      catalogId: null,
      name: 'B',
      url: 'http://b',
      logo: '',
      tags: [],
      integration: null,
    },
  ],
  gridOrder: ['a', 'b'],
  pinnedOrder: ['a'],
  searchProviders: DEFAULT_SEARCH_PROVIDERS,
  activeSearchProviderId: 'ddg',
}

describe('normalizeWilabConfig', () => {
  it('prunes orphan ids from grid and pinned orders', () => {
    const normalized = normalizeWilabConfig({
      ...base,
      gridOrder: ['a', 'ghost', 'b'],
      pinnedOrder: ['ghost', 'a'],
    })

    expect(normalized.gridOrder).toEqual(['a', 'b'])
    expect(normalized.pinnedOrder).toEqual(['a'])
  })

  it('dedupes order arrays preserving first occurrence', () => {
    const normalized = normalizeWilabConfig({
      ...base,
      gridOrder: ['b', 'a', 'b', 'a'],
      pinnedOrder: ['a', 'a'],
    })

    expect(normalized.gridOrder).toEqual(['b', 'a'])
    expect(normalized.pinnedOrder).toEqual(['a'])
  })

  it('appends service ids missing from gridOrder', () => {
    const normalized = normalizeWilabConfig({
      ...base,
      gridOrder: ['b'],
    })

    expect(normalized.gridOrder).toEqual(['b', 'a'])
  })

  it('falls back active search provider when missing', () => {
    const normalized = normalizeWilabConfig({
      ...base,
      activeSearchProviderId: 'nope',
    })

    expect(normalized.activeSearchProviderId).toBe('ddg')
  })

  it('restores default search providers when empty', () => {
    const normalized = normalizeWilabConfig({
      ...base,
      searchProviders: [],
      activeSearchProviderId: 'ddg',
    })

    expect(normalized.searchProviders).toEqual(DEFAULT_SEARCH_PROVIDERS)
    expect(normalized.activeSearchProviderId).toBe('ddg')
  })
})
