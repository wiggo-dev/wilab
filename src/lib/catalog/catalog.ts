import { CATALOG_ENTRIES } from './entries'
import type { CatalogEntry, CatalogEntryId } from './types'

export function catalogLogoPath(id: string): string {
  return `/catalog/icons/${id}.svg`
}

function withLogo(entry: CatalogEntry): CatalogEntry {
  return {
    ...entry,
    logo: catalogLogoPath(entry.id),
  }
}

export function getCatalog(): CatalogEntry[] {
  return CATALOG_ENTRIES.map(withLogo)
}

export function getCatalogEntryById(id: string): CatalogEntry | null {
  const entry = CATALOG_ENTRIES.find((candidate) => candidate.id === id)
  return entry ? withLogo(entry) : null
}

export function isCatalogEntryId(id: string): id is CatalogEntryId {
  return CATALOG_ENTRIES.some((entry) => entry.id === id)
}
