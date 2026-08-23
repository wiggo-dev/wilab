import { describe, expect, it } from 'vitest'
import { CATALOG_ENTRY_IDS } from './types'
import { getCatalog, getCatalogEntryById, catalogLogoPath } from './catalog'

describe('catalog', () => {
  it('contains all predefined services', () => {
    expect(getCatalog()).toHaveLength(18)
    expect(getCatalog().map((entry) => entry.id).sort()).toEqual([...CATALOG_ENTRY_IDS].sort())
  })

  it('returns entries with the expected shape', () => {
    for (const entry of getCatalog()) {
      expect(entry.id).toEqual(expect.any(String))
      expect(entry.name.length).toBeGreaterThan(0)
      expect(entry.defaultUrl).toMatch(/^https?:\/\/\{host\}/)
      expect(entry.logo).toBe(catalogLogoPath(entry.id))
      expect(entry.integration === null || typeof entry.integration === 'string').toBe(true)
    }
  })

  it('looks up entries by id', () => {
    const sonarr = getCatalogEntryById('sonarr')
    expect(sonarr).toMatchObject({
      id: 'sonarr',
      name: 'Sonarr',
      defaultUrl: 'http://{host}:8989',
      integration: 'sonarr',
    })
    expect(getCatalogEntryById('not-in-catalog')).toBeNull()
  })

  it('resolves bundled logo paths under /catalog/icons', () => {
    expect(catalogLogoPath('plex')).toBe('/catalog/icons/plex.svg')
  })
})
