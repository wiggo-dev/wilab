'use client'

import { useMemo, useState } from 'react'
import type { CatalogEntry } from '@/lib/catalog/types'
import type { WilabConfig } from '@/lib/config/types'
import { useWilabConfig } from '@/hooks/useWilabConfig'
import { useLiveGlances } from '@/hooks/useLiveGlances'
import { allTags, buildSearchUrl, gridServices, pinnedServices } from '@/lib/landing/view-model'
import { CatalogPicker } from './CatalogPicker'
import { CustomServiceForm } from './CustomServiceForm'
import { Modal } from './Modal'
import { SearchProviderDialog } from './SearchProviderDialog'
import { ServiceForm } from './ServiceForm'
import { ServiceTile } from './ServiceTile'
import { TagChip } from './TagChip'

type DialogState =
  | { kind: 'none' }
  | { kind: 'edit'; id: string }
  | { kind: 'add' }
  | { kind: 'custom' }
  | { kind: 'search-providers' }

type LandingPageProps = {
  config: WilabConfig
  catalog: CatalogEntry[]
}

export function LandingPage({ config: initialConfig, catalog }: LandingPageProps) {
  const {
    config,
    editMode,
    setEditMode,
    addFromCatalog,
    saveCustomService,
    saveService,
    deleteService,
    pinService,
    dragReorderGrid,
    dragReorderPinned,
    changeActiveSearchProvider,
    saveSearchProvider,
    createSearchProvider,
  } = useWilabConfig(initialConfig)
  const { glances, loaded } = useLiveGlances()

  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' })

  const tags = useMemo(() => allTags(config.services), [config.services])
  const pinned = useMemo(
    () => pinnedServices(config.services, config.pinnedOrder),
    [config.pinnedOrder, config.services],
  )
  const grid = useMemo(
    () => gridServices(config.services, config.gridOrder, activeTag),
    [activeTag, config.gridOrder, config.services],
  )

  const editingService =
    dialog.kind === 'edit' ? config.services.find((service) => service.id === dialog.id) : null

  function toggleTag(tag: string) {
    setActiveTag((current) => (current === tag ? null : tag))
  }

  function submitSearch() {
    const provider = config.searchProviders.find((entry) => entry.id === config.activeSearchProviderId)
    if (!provider) return
    const url = buildSearchUrl(provider.template, searchQuery)
    if (!url) return
    window.open(url, '_blank', 'noopener')
  }

  async function pickCatalogEntry(entry: CatalogEntry) {
    const serviceId = await addFromCatalog(entry)
    setDialog({ kind: 'edit', id: serviceId })
  }

  return (
    <div className="min-h-svh bg-[#0b1220] pb-36 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.12),_transparent_55%)]" />
      <header role="banner" className="relative border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-2.5">
          <p className="shrink-0 text-sm tracking-[0.3em] text-sky-300/80 uppercase">wilab</p>
          <form
            className="flex min-w-0 flex-1 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/15"
            onSubmit={(event) => {
              event.preventDefault()
              submitSearch()
            }}
          >
            <select
              className="bg-transparent px-3 text-sm outline-none"
              value={config.activeSearchProviderId}
              onChange={(event) => void changeActiveSearchProvider(event.target.value)}
              aria-label="Search provider"
            >
              {config.searchProviders.map((provider) => (
                <option key={provider.id} value={provider.id} className="text-black">
                  {provider.name}
                </option>
              ))}
            </select>
            <input
              className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-slate-400"
              placeholder="Search the web"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search query"
            />
          </form>
          {editMode && (
            <button
              type="button"
              className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
              onClick={() => setDialog({ kind: 'search-providers' })}
            >
              Search providers
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditMode((current) => !current)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${editMode ? 'bg-amber-400 text-black' : 'bg-white/10 hover:bg-white/20'}`}
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
        </div>
        <div className="mx-auto flex max-w-5xl flex-wrap gap-1.5 px-6 pb-2">
          <TagChip active={activeTag == null} onClick={() => setActiveTag(null)}>
            All
          </TagChip>
          {tags.map((tag) => (
            <TagChip key={tag} tag={tag} active={activeTag === tag} onClick={() => toggleTag(tag)}>
              {tag}
            </TagChip>
          ))}
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 pt-5">
        <section>
          <h2 className="mb-2 text-xs tracking-[0.25em] text-sky-200/70 uppercase">Pinned</h2>
          <div className="flex flex-wrap gap-2">
            {pinned.map((service) => (
              <ServiceTile
                key={service.id}
                service={service}
                compact
                zone="pinned"
                activeTag={activeTag}
                editMode={editMode}
                pinned
                onTagClick={toggleTag}
                onEdit={() => setDialog({ kind: 'edit', id: service.id })}
                onTogglePin={() => void pinService(service.id)}
                onReorder={(draggedId) => dragReorderPinned(draggedId, service.id)}
                glance={loaded ? glances[service.id] : undefined}
              />
            ))}
          </div>
        </section>
        <section className="mt-5">
          <h2 className="mb-2 text-xs tracking-[0.25em] text-sky-200/70 uppercase">Main grid</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {grid.map((service) => (
              <ServiceTile
                key={service.id}
                service={service}
                zone="grid"
                activeTag={activeTag}
                editMode={editMode}
                pinned={config.pinnedOrder.includes(service.id)}
                onTagClick={toggleTag}
                onEdit={() => setDialog({ kind: 'edit', id: service.id })}
                onTogglePin={() => void pinService(service.id)}
                onReorder={(draggedId) => dragReorderGrid(draggedId, service.id)}
                glance={loaded ? glances[service.id] : undefined}
              />
            ))}
            {editMode && (
              <button
                type="button"
                aria-label="Add service"
                onClick={() => setDialog({ kind: 'add' })}
                className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-dashed border-white/25 text-slate-400 hover:bg-white/5"
              >
                <span className="text-3xl">+</span>
                <span className="text-xs">Add</span>
              </button>
            )}
          </div>
        </section>
      </main>

      {dialog.kind === 'edit' && editingService && (
        <Modal title={`Edit ${editingService.name}`} onClose={() => setDialog({ kind: 'none' })}>
          <ServiceForm
            service={editingService}
            onSave={async (patch) => {
              await saveService(editingService.id, patch)
              setDialog({ kind: 'none' })
            }}
            onRemove={async () => {
              await deleteService(editingService.id)
              setDialog({ kind: 'none' })
            }}
          />
        </Modal>
      )}

      {dialog.kind === 'add' && (
        <Modal title="Add a service" onClose={() => setDialog({ kind: 'none' })}>
          <CatalogPicker
            catalog={catalog}
            services={config.services}
            onPick={(entry) => void pickCatalogEntry(entry)}
            onCustom={() => setDialog({ kind: 'custom' })}
          />
        </Modal>
      )}

      {dialog.kind === 'custom' && (
        <Modal title="Custom service" onClose={() => setDialog({ kind: 'none' })}>
          <CustomServiceForm
            onSave={async (input) => {
              await saveCustomService(input)
              setDialog({ kind: 'none' })
            }}
          />
        </Modal>
      )}

      {dialog.kind === 'search-providers' && (
        <Modal title="Search providers" onClose={() => setDialog({ kind: 'none' })}>
          <SearchProviderDialog
            providers={config.searchProviders}
            activeProviderId={config.activeSearchProviderId}
            onSave={saveSearchProvider}
            onAdd={createSearchProvider}
            onSetActive={changeActiveSearchProvider}
          />
        </Modal>
      )}
    </div>
  )
}
