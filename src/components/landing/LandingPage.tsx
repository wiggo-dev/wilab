'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { CatalogEntry } from '@/lib/catalog/types'
import { catalogUrlUsesHostTemplate, substituteHostInUrl } from '@/lib/catalog/host-template'
import {
  configExportJson,
  parseConfigImport,
  summarizeConfigImport,
} from '@/lib/config/import'
import {
  addHostPreset,
  addSearchProvider,
  addService,
  createCustomService,
  createServiceFromCatalog,
  removeHostPreset,
  removeService,
  reorderGrid,
  reorderPinned,
  setActiveSearchProvider,
  togglePin,
  updateHostPreset,
  updateSearchProvider,
  updateService,
} from '@/lib/config/mutations'
import type { Service, WilabConfig } from '@/lib/config/types'
import { createId } from '@/lib/id'
import { useConfigSession } from '@/hooks/useConfigSession'
import { useLiveGlances } from '@/hooks/useLiveGlances'
import { useReorderDrag } from '@/hooks/useReorderDrag'
import { allTags, buildSearchUrl, filterServicesByTileQuery, gridServices, pinnedServices } from '@/lib/landing/view-model'
import { CatalogPicker } from './CatalogPicker'
import { CustomServiceForm } from './CustomServiceForm'
import { HostPresetPicker } from './HostPresetPicker'
import { HostPresetsDialog } from './HostPresetsDialog'
import { Modal } from './Modal'
import { SearchProviderDialog } from './SearchProviderDialog'
import { ServiceForm } from './ServiceForm'
import { ServiceTile } from './ServiceTile'
import { TagChip } from './TagChip'

type DialogState =
  | { kind: 'none' }
  | { kind: 'edit'; id: string }
  | { kind: 'edit-new'; service: Service }
  | { kind: 'add' }
  | { kind: 'pick-host'; entry: CatalogEntry }
  | { kind: 'host-presets' }
  | { kind: 'custom' }
  | { kind: 'search-providers' }
  | { kind: 'confirm-delete'; id: string }
  | { kind: 'confirm-import'; config: WilabConfig }

type LandingPageProps = {
  config: WilabConfig
  catalog: CatalogEntry[]
}

export function LandingPage({ config: initialConfig, catalog }: LandingPageProps) {
  const { config: rawConfig, displayConfig: config, editMode, setEditMode, apply } =
    useConfigSession(initialConfig)
  const glanceRefreshKey = config.services
    .map((service) => `${service.id}:${JSON.stringify(service.integration)}:${service.url}`)
    .join('|')
  const { glances, loaded } = useLiveGlances(glanceRefreshKey)

  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' })
  const [importError, setImportError] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const pinnedDrag = useReorderDrag({
    zone: 'pinned',
    order: config.pinnedOrder,
    onCommit: (id, beforeId) =>
      void apply((current) => reorderPinned(current, id, beforeId), { debounce: true }),
  })
  const gridDrag = useReorderDrag({
    zone: 'grid',
    order: config.gridOrder,
    onCommit: (id, beforeId) =>
      void apply((current) => reorderGrid(current, id, beforeId), { debounce: true }),
  })

  const tags = useMemo(() => allTags(config.services), [config.services])
  // Stable DOM order (committed). Visual reorder uses CSS `order` from the hook.
  const pinned = useMemo(
    () =>
      filterServicesByTileQuery(
        pinnedServices(config.services, pinnedDrag.sourceOrder),
        searchQuery,
      ),
    [config.services, pinnedDrag.sourceOrder, searchQuery],
  )
  const grid = useMemo(
    () =>
      filterServicesByTileQuery(
        gridServices(config.services, gridDrag.sourceOrder, activeTag),
        searchQuery,
      ),
    [activeTag, config.services, gridDrag.sourceOrder, searchQuery],
  )
  const tileQueryActive = searchQuery.trim().length > 0

  const editingService =
    dialog.kind === 'edit'
      ? config.services.find((service) => service.id === dialog.id)
      : dialog.kind === 'edit-new'
        ? dialog.service
        : null
  const editingIsNew = dialog.kind === 'edit-new'
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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
          return
        }
      }
      event.preventDefault()
      searchInputRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function openCatalogServiceDraft(entry: CatalogEntry, host: string | null) {
    const service = createServiceFromCatalog(entry, createId())
    if (host) {
      service.url = substituteHostInUrl(service.url, host)
    }
    setDialog({ kind: 'edit-new', service })
  }

  function pickCatalogEntry(entry: CatalogEntry) {
    if (catalogUrlUsesHostTemplate(entry.defaultUrl) && rawConfig.hostPresets.length > 0) {
      setDialog({ kind: 'pick-host', entry })
      return
    }
    openCatalogServiceDraft(entry, null)
  }

  const closeDialog = useCallback(() => {
    setDialog({ kind: 'none' })
  }, [])

  const importSummary =
    dialog.kind === 'confirm-import' ? summarizeConfigImport(dialog.config) : null

  const dialogTitle =
    dialog.kind === 'add'
      ? 'Add a service'
      : dialog.kind === 'pick-host'
        ? 'Choose host'
        : dialog.kind === 'host-presets'
          ? 'Host presets'
          : dialog.kind === 'custom'
        ? 'Custom service'
        : dialog.kind === 'search-providers'
          ? 'Search providers'
          : dialog.kind === 'confirm-delete'
            ? 'Remove service?'
            : dialog.kind === 'confirm-import'
              ? 'Import config?'
              : dialog.kind === 'edit-new' && editingService
                ? `Add ${editingService.name}`
                : dialog.kind === 'edit' && editingService
                  ? `Edit ${editingService.name}`
                  : ''

  function exportConfig() {
    const blob = new Blob([configExportJson(rawConfig)], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = 'wilab-config.json'
    anchor.click()
    URL.revokeObjectURL(href)
  }

  async function onImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const raw = await file.text()
    const result = parseConfigImport(raw)
    if (!result.ok) {
      setImportError(result.error)
      return
    }

    setImportError(null)
    setDialog({ kind: 'confirm-import', config: result.config })
  }

  async function confirmImport() {
    if (dialog.kind !== 'confirm-import') return
    await apply(() => dialog.config)
    setImportError(null)
    closeDialog()
  }

  async function confirmDelete() {
    if (!deletingService) return
    const id = deletingService.id
    await apply((current) => removeService(current, id))
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
              onChange={(event) =>
                void apply((current) => setActiveSearchProvider(current, event.target.value))
              }
              aria-label="Search provider"
            >
              {config.searchProviders.map((provider) => (
                <option key={provider.id} value={provider.id} className="text-black">
                  {provider.name}
                </option>
              ))}
            </select>
            <input
              ref={searchInputRef}
              className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-slate-400"
              placeholder="Search the web — type to filter tiles"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search query"
            />
          </form>
          {editMode && (
            <>
              <button
                type="button"
                className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                onClick={() => setDialog({ kind: 'host-presets' })}
              >
                Host presets
              </button>
              <button
                type="button"
                className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                onClick={() => setDialog({ kind: 'search-providers' })}
              >
                Search providers
              </button>
              <button
                type="button"
                className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                onClick={exportConfig}
              >
                Export config
              </button>
              <button
                type="button"
                className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                onClick={() => importInputRef.current?.click()}
              >
                Import config
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label="Import config file"
                onChange={(event) => void onImportFileChange(event)}
              />
            </>
          )}
          <button
            type="button"
            onClick={() => setEditMode((current) => !current)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${editMode ? 'bg-amber-400 text-black' : 'bg-white/10 hover:bg-white/20'}`}
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
        </div>
        {editMode && importError && (
          <p className="mx-auto max-w-5xl px-6 pb-2 text-sm text-rose-300" role="alert">
            {importError}
          </p>
        )}
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
              <div key={service.id} style={{ order: pinnedDrag.visualIndex(service.id) }}>
                <ServiceTile
                  service={service}
                  compact
                  zone="pinned"
                  activeTag={activeTag}
                  editMode={editMode}
                  pinned
                  isDragging={pinnedDrag.isDragging(service.id)}
                  isDropTarget={pinnedDrag.isDropTarget(service.id)}
                  onTagClick={toggleTag}
                  onEdit={() => setDialog({ kind: 'edit', id: service.id })}
                  onTogglePin={() => void apply((current) => togglePin(current, service.id))}
                  onDelete={() => setDialog({ kind: 'confirm-delete', id: service.id })}
                  onDragBegin={(_zone, id) => pinnedDrag.begin(id)}
                  onDragHover={(_zone, id) => pinnedDrag.hover(id)}
                  onDragEnd={pinnedDrag.end}
                  onDropCommit={pinnedDrag.dropCommit}
                  glance={loaded ? glances[service.id] : undefined}
                />
              </div>
            ))}
            {pinned.length === 0 && tileQueryActive && (
              <p className="text-sm text-slate-400">No services match</p>
            )}
          </div>
        </section>
        <section className="mt-5">
          <h2 className="mb-2 text-xs tracking-[0.25em] text-sky-200/70 uppercase">Main grid</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {grid.map((service) => (
              <div key={service.id} style={{ order: gridDrag.visualIndex(service.id) }}>
                <ServiceTile
                  service={service}
                  zone="grid"
                  activeTag={activeTag}
                  editMode={editMode}
                  pinned={config.pinnedOrder.includes(service.id)}
                  isDragging={gridDrag.isDragging(service.id)}
                  isDropTarget={gridDrag.isDropTarget(service.id)}
                  onTagClick={toggleTag}
                  onEdit={() => setDialog({ kind: 'edit', id: service.id })}
                  onTogglePin={() => void apply((current) => togglePin(current, service.id))}
                  onDelete={() => setDialog({ kind: 'confirm-delete', id: service.id })}
                  onDragBegin={(_zone, id) => gridDrag.begin(id)}
                  onDragHover={(_zone, id) => gridDrag.hover(id)}
                  onDragEnd={gridDrag.end}
                  onDropCommit={gridDrag.dropCommit}
                  glance={loaded ? glances[service.id] : undefined}
                />
              </div>
            ))}
            {editMode && (
              <button
                type="button"
                aria-label="Add service"
                onClick={() => setDialog({ kind: 'add' })}
                style={{ order: 10_000 }}
                className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-dashed border-white/25 text-slate-400 hover:bg-white/5"
              >
                <span className="text-3xl">+</span>
                <span className="text-xs">Add</span>
              </button>
            )}
            {grid.length === 0 && (tileQueryActive || activeTag != null) && (
              <p className="col-span-full text-sm text-slate-400" style={{ order: 9_000 }}>
                No services match
              </p>
            )}
          </div>
        </section>
      </main>

      {dialog.kind !== 'none' && dialogTitle && (
        <Modal title={dialogTitle} onClose={closeDialog}>
          {dialog.kind === 'add' && (
            <CatalogPicker
              catalog={catalog}
              services={config.services}
              onPick={pickCatalogEntry}
              onCustom={() => setDialog({ kind: 'custom' })}
            />
          )}

          {dialog.kind === 'pick-host' && (
            <HostPresetPicker
              entry={dialog.entry}
              presets={rawConfig.hostPresets}
              onPick={(host) => openCatalogServiceDraft(dialog.entry, host)}
              onManual={() => openCatalogServiceDraft(dialog.entry, null)}
              onBack={() => setDialog({ kind: 'add' })}
            />
          )}

          {(dialog.kind === 'edit' || dialog.kind === 'edit-new') && editingService && (
            <ServiceForm
              key={editingService.id}
              service={editingService}
              hostPresets={rawConfig.hostPresets}
              removeLabel={editingIsNew ? 'Cancel' : 'Remove'}
              onSave={async (patch) => {
                if (editingIsNew) {
                  await apply((current) =>
                    addService(current, { ...editingService, ...patch }),
                  )
                } else {
                  await apply((current) => updateService(current, editingService.id, patch))
                }
                closeDialog()
              }}
              onRemove={async () => {
                if (!editingIsNew) {
                  await apply((current) => removeService(current, editingService.id))
                }
                closeDialog()
              }}
            />
          )}

          {dialog.kind === 'confirm-delete' && deletingService && (
            <>
              <p className="text-sm text-slate-300">
                Remove <span className="font-medium text-white">{deletingService.name}</span> from
                your landing page? This cannot be undone from here.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10"
                  onClick={closeDialog}
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
            </>
          )}

          {dialog.kind === 'confirm-import' && importSummary && (
            <>
              <p className="text-sm text-slate-300">
                This replaces your current config with{' '}
                <span className="font-medium text-white">
                  {importSummary.serviceCount}{' '}
                  {importSummary.serviceCount === 1 ? 'service' : 'services'}
                </span>
                {importSummary.pinnedCount > 0
                  ? ` (${importSummary.pinnedCount} pinned)`
                  : ''}
                {' '}and {importSummary.searchProviderCount} search{' '}
                {importSummary.searchProviderCount === 1 ? 'provider' : 'providers'}.
              </p>
              <p className="mt-3 text-sm text-amber-200/90">
                Exported configs contain secrets (API keys and passwords). Treat the file as
                confidential.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10"
                  onClick={closeDialog}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-amber-400 px-3 py-1.5 text-sm text-black hover:bg-amber-300"
                  onClick={() => void confirmImport()}
                >
                  Replace config
                </button>
              </div>
            </>
          )}

          {dialog.kind === 'custom' && (
            <CustomServiceForm
              onSave={async (input) => {
                await apply((current) =>
                  addService(
                    current,
                    createCustomService({
                      id: createId(),
                      ...input,
                    }),
                  ),
                )
                closeDialog()
              }}
            />
          )}

          {dialog.kind === 'host-presets' && (
            <HostPresetsDialog
              presets={rawConfig.hostPresets}
              onAdd={(host) => apply((current) => addHostPreset(current, host))}
              onUpdate={(index, host) => apply((current) => updateHostPreset(current, index, host))}
              onRemove={(index) => apply((current) => removeHostPreset(current, index))}
            />
          )}

          {dialog.kind === 'search-providers' && (
            <SearchProviderDialog
              providers={config.searchProviders}
              activeProviderId={config.activeSearchProviderId}
              onSave={(id, patch) =>
                apply((current) => updateSearchProvider(current, id, patch))
              }
              onAdd={(provider) => apply((current) => addSearchProvider(current, provider))}
              onSetActive={(id) => apply((current) => setActiveSearchProvider(current, id))}
            />
          )}
        </Modal>
      )}
    </div>
  )
}
