'use client'

import { useMemo, useState } from 'react'
import type { CatalogEntry } from '@/lib/catalog/types'
import type { Service } from '@/lib/config/types'
import { ServiceLogo } from './ServiceTile'

export function CatalogPicker({
  catalog,
  services,
  onPick,
  onCustom,
}: {
  catalog: CatalogEntry[]
  services: Service[]
  onPick: (entry: CatalogEntry) => void
  onCustom: () => void
}) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()

  const matches = useMemo(() => {
    if (!normalizedQuery) return catalog
    return catalog.filter((entry) => entry.name.toLowerCase().includes(normalizedQuery))
  }, [catalog, normalizedQuery])

  return (
    <>
      <input
        autoFocus
        className="mb-3 w-full rounded-lg bg-white/10 px-3 py-2 text-sm outline-none ring-1 ring-white/15 placeholder:text-slate-500"
        placeholder="Search the catalog"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {matches.length === 0 ? (
        <p className="mb-3 text-sm text-slate-400">No catalog entries match.</p>
      ) : (
        <div className="grid max-h-72 grid-cols-3 gap-2 overflow-auto">
          {matches.map((entry) => {
            const count = services.filter((service) => service.catalogId === entry.id).length
            return (
              <button
                key={entry.id}
                type="button"
                className="rounded-xl bg-white/5 p-3 hover:bg-white/10"
                onClick={() => onPick(entry)}
              >
                <ServiceLogo service={entry} className="mx-auto h-10 w-10" />
                <div className="mt-2 text-xs">{entry.name}</div>
                {count > 0 && <div className="mt-1 text-[10px] text-sky-300">{count} on page</div>}
              </button>
            )
          })}
        </div>
      )}
      <button
        type="button"
        className="mt-4 w-full rounded-xl bg-sky-500 py-2 text-sm font-medium text-black"
        onClick={onCustom}
      >
        Custom service…
      </button>
    </>
  )
}
