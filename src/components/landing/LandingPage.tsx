'use client'

import { useMemo, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import type { CatalogEntry } from '@/lib/catalog/types'
import type { WilabConfig } from '@/lib/config/types'
import { useWilabConfig } from '@/hooks/useWilabConfig'
import { useLiveGlances } from '@/hooks/useLiveGlances'
import {
  type DragPreviewState,
  shouldShowDropSlot,
} from '@/lib/landing/drag-preview'
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
  | { kind: 'confirm-delete'; id: string }

type LandingPageProps = {
  config: WilabConfig
  catalog: CatalogEntry[]
}

function DropSlot({
  compact,
  beforeId,
  onHover,
  onDropCommit,
}: {
  compact?: boolean
  beforeId: string
  onHover: (beforeId: string) => void
  onDropCommit: () => void
}) {
  return (
    <div
      aria-hidden
      onDragOver={(event: DragEvent) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        onHover(beforeId)
      }}
      onDrop={(event: DragEvent) => {
        event.preventDefault()
        onDropCommit()
      }}
      className={`rounded-2xl border-2 border-dashed border-amber-300/70 bg-amber-400/10 ${compact ? 'h-32 w-28' : 'aspect-square'}`}
    />
  )
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
  const [drag, setDrag] = useState<DragPreviewState | null>(null)
  const dragRef = useRef<DragPreviewState | null>(null)
  const didDropRef = useRef(false)

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
  const deletingService =
    dialog.kind === 'confirm-delete'
      ? config.services.find((service) => service.id === dialog.id)
      : null

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

  function setDragState(next: DragPreviewState | null) {
    dragRef.current = next
    setDrag(next)
  }

  function onDragBegin(zone: 'grid' | 'pinned', id: string) {
    didDropRef.current = false
    setDragState({ zone, draggedId: id, overId: id })
  }

  function onDragHover(zone: 'grid' | 'pinned', id: string) {
    const current = dragRef.current
    if (!current || current.zone !== zone) return
    if (current.overId === id) return
    setDragState({ ...current, overId: id })
  }

  function commitDrag() {
    const current = dragRef.current
    if (!current?.overId || current.draggedId === current.overId) {
      setDragState(null)
      return
    }

    didDropRef.current = true
    if (current.zone === 'grid') {
      dragReorderGrid(current.draggedId, current.overId)
    } else {
      dragReorderPinned(current.draggedId, current.overId)
    }
    setDragState(null)
  }

  function onDragEnd() {
    if (!didDropRef.current) {
      setDragState(null)
    }
    didDropRef.current = false
  }

  async function confirmDelete() {
    if (!deletingService) return
    const id = deletingService.id
    await deleteService(id)
    setDialog({ kind: 'none' })
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
              <div key={service.id} className="contents">
                {shouldShowDropSlot(drag, 'pinned', service.id) && (
                  <DropSlot
                    compact
                    beforeId={service.id}
                    onHover={(beforeId) => onDragHover('pinned', beforeId)}
                    onDropCommit={commitDrag}
                  />
                )}
                <ServiceTile
                  service={service}
                  compact
                  zone="pinned"
                  activeTag={activeTag}
                  editMode={editMode}
                  pinned
                  isDragging={drag?.zone === 'pinned' && drag.draggedId === service.id}
                  isDropTarget={shouldShowDropSlot(drag, 'pinned', service.id)}
                  onTagClick={toggleTag}
                  onEdit={() => setDialog({ kind: 'edit', id: service.id })}
                  onTogglePin={() => void pinService(service.id)}
                  onDelete={() => setDialog({ kind: 'confirm-delete', id: service.id })}
                  onDragBegin={onDragBegin}
                  onDragHover={onDragHover}
                  onDragEnd={onDragEnd}
                  onDropCommit={commitDrag}
                  glance={loaded ? glances[service.id] : undefined}
                />
              </div>
            ))}
          </div>
        </section>
        <section className="mt-5">
          <h2 className="mb-2 text-xs tracking-[0.25em] text-sky-200/70 uppercase">Main grid</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {grid.map((service) => (
              <div key={service.id} className="contents">
                {shouldShowDropSlot(drag, 'grid', service.id) && (
                  <DropSlot
                    beforeId={service.id}
                    onHover={(beforeId) => onDragHover('grid', beforeId)}
                    onDropCommit={commitDrag}
                  />
                )}
                <ServiceTile
                  service={service}
                  zone="grid"
                  activeTag={activeTag}
                  editMode={editMode}
                  pinned={config.pinnedOrder.includes(service.id)}
                  isDragging={drag?.zone === 'grid' && drag.draggedId === service.id}
                  isDropTarget={shouldShowDropSlot(drag, 'grid', service.id)}
                  onTagClick={toggleTag}
                  onEdit={() => setDialog({ kind: 'edit', id: service.id })}
                  onTogglePin={() => void pinService(service.id)}
                  onDelete={() => setDialog({ kind: 'confirm-delete', id: service.id })}
                  onDragBegin={onDragBegin}
                  onDragHover={onDragHover}
                  onDragEnd={onDragEnd}
                  onDropCommit={commitDrag}
                  glance={loaded ? glances[service.id] : undefined}
                />
              </div>
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

      {dialog.kind === 'confirm-delete' && deletingService && (
        <Modal title="Remove service?" onClose={() => setDialog({ kind: 'none' })}>
          <p className="text-sm text-slate-300">
            Remove <span className="font-medium text-white">{deletingService.name}</span> from your
            landing page? This cannot be undone from here.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10"
              onClick={() => setDialog({ kind: 'none' })}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg bg-rose-500 px-3 py-1.5 text-sm text-white hover:bg-rose-400"
              onClick={() => void confirmDelete()}
            >
              Remove
            </button>
          </div>
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
