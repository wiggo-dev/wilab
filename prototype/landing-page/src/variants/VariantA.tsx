import { useState, type DragEvent, type FormEvent, type ReactNode } from 'react'
import { tagClass } from '../tagColors'
import type { LandingApi, Service } from '../types'

export const variantName = 'Tile wall'

type Dialog =
  | { kind: 'none' }
  | { kind: 'edit'; id: string }
  | { kind: 'add' }
  | { kind: 'custom' }

export function VariantA({ api }: { api: LandingApi }) {
  const [dialog, setDialog] = useState<Dialog>({ kind: 'none' })
  const editing = dialog.kind === 'edit' ? api.state.services.find((s) => s.id === dialog.id) : null

  return (
    <div className="min-h-svh bg-[#0b1220] pb-36 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.12),_transparent_55%)]" />
      <header className="relative border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-2.5">
          <p className="shrink-0 text-sm tracking-[0.3em] text-sky-300/80 uppercase">wilab</p>
          <form
            className="flex min-w-0 flex-1 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/15"
            onSubmit={(e) => {
              e.preventDefault()
              api.submitSearch()
            }}
          >
            <select
              className="bg-transparent px-3 text-sm outline-none"
              value={api.state.searchProviderId}
              onChange={(e) => api.setSearchProviderId(e.target.value)}
            >
              {api.state.searchProviders.map((p) => (
                <option key={p.id} value={p.id} className="text-black">
                  {p.name}
                </option>
              ))}
            </select>
            <input
              className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-slate-400"
              placeholder="Search the web"
              value={api.state.searchQuery}
              onChange={(e) => api.setSearchQuery(e.target.value)}
            />
          </form>
          <button
            type="button"
            onClick={api.toggleEditMode}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${api.state.editMode ? 'bg-amber-400 text-black' : 'bg-white/10 hover:bg-white/20'}`}
          >
            {api.state.editMode ? 'Done' : 'Edit'}
          </button>
        </div>
        <div className="mx-auto flex max-w-5xl flex-wrap gap-1.5 px-6 pb-2">
          <TagChip active={api.state.activeTag == null} onClick={() => api.setTag(null)}>
            All
          </TagChip>
          {api.allTags.map((tag) => (
            <TagChip key={tag} tag={tag} active={api.state.activeTag === tag} onClick={() => api.setTag(api.state.activeTag === tag ? null : tag)}>
              {tag}
            </TagChip>
          ))}
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 pt-5">
        <section>
          <h2 className="mb-2 text-xs tracking-[0.25em] text-sky-200/70 uppercase">Pinned</h2>
          <div className="flex flex-wrap gap-2">
            {api.pinnedServices.map((service) => (
              <Tile
                key={service.id}
                service={service}
                compact
                pinned
                api={api}
                zone="pinned"
                onEdit={() => setDialog({ kind: 'edit', id: service.id })}
              />
            ))}
          </div>
        </section>
        <section className="mt-5">
          <h2 className="mb-2 text-xs tracking-[0.25em] text-sky-200/70 uppercase">Main grid</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {api.gridServices.map((service) => (
              <Tile
                key={service.id}
                service={service}
                pinned={api.state.pinnedOrder.includes(service.id)}
                api={api}
                zone="grid"
                onEdit={() => setDialog({ kind: 'edit', id: service.id })}
              />
            ))}
            {api.state.editMode && (
              <button
                type="button"
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

      {dialog.kind === 'edit' && editing && (
        <Modal title={`Edit ${editing.name}`} onClose={() => setDialog({ kind: 'none' })}>
          <ServiceForm
            service={editing}
            onSave={(patch) => {
              api.updateService(editing.id, patch)
              setDialog({ kind: 'none' })
            }}
            onRemove={() => {
              api.removeService(editing.id)
              setDialog({ kind: 'none' })
            }}
          />
        </Modal>
      )}
      {dialog.kind === 'add' && (
        <Modal title="Add a service" onClose={() => setDialog({ kind: 'none' })}>
          <CatalogPicker
            api={api}
            onPick={(id) => setDialog({ kind: 'edit', id })}
            onCustom={() => setDialog({ kind: 'custom' })}
          />
        </Modal>
      )}
      {dialog.kind === 'custom' && (
        <Modal title="Custom service" onClose={() => setDialog({ kind: 'none' })}>
          <CustomForm
            onSave={(service) => {
              api.addService(service)
              setDialog({ kind: 'none' })
            }}
          />
        </Modal>
      )}
    </div>
  )
}

function TagChip({
  tag,
  active,
  onClick,
  children,
}: {
  tag?: string
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  const color = tag
    ? tagClass(tag, active)
    : active
      ? 'bg-white text-black ring-1 ring-white'
      : 'bg-white/10 text-slate-200 ring-1 ring-white/15 hover:bg-white/20'
  return (
    <button type="button" onClick={onClick} className={`rounded-full px-2.5 py-0.5 text-xs ${color}`}>
      {children}
    </button>
  )
}

function Tile({
  service,
  compact,
  pinned,
  api,
  zone,
  onEdit,
}: {
  service: Service
  compact?: boolean
  pinned: boolean
  api: LandingApi
  zone: 'grid' | 'pinned'
  onEdit: () => void
}) {
  function onDragStart(e: DragEvent) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ zone, id: service.id }))
  }
  function onDrop(e: DragEvent) {
    e.preventDefault()
    const raw = e.dataTransfer.getData('text/plain')
    if (!raw) return
    const payload = JSON.parse(raw) as { zone: 'grid' | 'pinned'; id: string }
    if (payload.zone !== zone) return
    if (zone === 'grid') api.reorderGrid(payload.id, service.id)
    else api.reorderPinned(payload.id, service.id)
  }

  const inner = (
    <>
      <Logo service={service} className={compact ? 'h-7 w-7' : 'h-10 w-10'} />
      <div className={`truncate ${compact ? 'mt-1 text-[11px]' : 'mt-1.5 text-xs'}`}>{service.name}</div>
      {service.live && (
        <div className="mt-1 max-w-full truncate rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[10px] text-emerald-200">
          {service.live}
        </div>
      )}
    </>
  )

  return (
    <div
      draggable={api.state.editMode}
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={`group relative flex flex-col items-center rounded-2xl bg-white/8 p-2 ring-1 ${compact ? 'h-32 w-28 justify-between' : 'aspect-square justify-center'} ${zone === 'pinned' ? 'ring-sky-400/40' : 'ring-white/10'} ${api.state.editMode ? 'cursor-grab' : ''}`}
    >
      <button
        type="button"
        className={`absolute top-2 left-2 text-sm ${pinned ? 'text-amber-300' : 'hidden text-slate-400 group-hover:block'}`}
        onClick={() => api.togglePin(service.id)}
        aria-label={pinned ? 'Unpin' : 'Pin'}
      >
        ★
      </button>
      {api.state.editMode ? (
        <button type="button" className="flex min-h-0 w-full flex-1 flex-col items-center justify-center" onClick={onEdit}>
          {inner}
        </button>
      ) : (
        <a href={service.url} className="flex min-h-0 w-full flex-1 flex-col items-center justify-center text-inherit no-underline">
          {inner}
        </a>
      )}
      {service.tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-0.5 pt-1">
          {service.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`rounded-full px-1.5 py-px text-[9px] ${tagClass(tag, api.state.activeTag === tag)}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                api.setTag(api.state.activeTag === tag ? null : tag)
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Logo({ service, className }: { service: Service; className: string }) {
  if (!service.logo) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-white/15 text-lg font-semibold ${className}`}>
        {service.name.slice(0, 1)}
      </div>
    )
  }
  return <img src={service.logo} alt="" className={`object-contain ${className}`} />
}

function CatalogPicker({
  api,
  onPick,
  onCustom,
}: {
  api: LandingApi
  onPick: (id: string) => void
  onCustom: () => void
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const matches = api.catalog.filter((entry) => {
    if (!q) return true
    return entry.name.toLowerCase().includes(q) || entry.tags.some((tag) => tag.toLowerCase().includes(q))
  })

  return (
    <>
      <input
        autoFocus
        className="mb-3 w-full rounded-lg bg-white/10 px-3 py-2 text-sm outline-none ring-1 ring-white/15 placeholder:text-slate-500"
        placeholder="Search the catalog"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {matches.length === 0 ? (
        <p className="mb-3 text-sm text-slate-400">No catalog entries match.</p>
      ) : (
        <div className="grid max-h-72 grid-cols-3 gap-2 overflow-auto">
          {matches.map((entry) => {
            const count = api.state.services.filter((s) => s.catalogId === entry.id).length
            return (
              <button
                key={entry.id}
                type="button"
                className="rounded-xl bg-white/5 p-3 hover:bg-white/10"
                onClick={() => {
                  const id = api.addFromCatalog(entry.id)
                  if (id) onPick(id)
                }}
              >
                <Logo service={entry} className="mx-auto h-10 w-10" />
                <div className="mt-2 text-xs">{entry.name}</div>
                {count > 0 && <div className="mt-1 text-[10px] text-sky-300">{count} on page</div>}
              </button>
            )
          })}
        </div>
      )}
      <button type="button" className="mt-4 w-full rounded-xl bg-sky-500 py-2 text-sm font-medium text-black" onClick={onCustom}>
        Custom service…
      </button>
    </>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-md overflow-auto rounded-2xl bg-[#152038] p-5 ring-1 ring-white/15" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ServiceForm({
  service,
  onSave,
  onRemove,
}: {
  service: Service
  onSave: (patch: Partial<Service>) => void
  onRemove: () => void
}) {
  const [name, setName] = useState(service.name)
  const [url, setUrl] = useState(service.url)
  const [tags, setTags] = useState(service.tags.join(', '))
  const [credential, setCredential] = useState(service.credential)

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ name, url, tags: tags.split(',').map((t) => t.trim()).filter(Boolean), credential })
      }}
    >
      <label className="text-sm">
        Name
        <input className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="text-sm">
        URL
        <input className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label className="text-sm">
        Tags (comma-separated)
        <input className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2" value={tags} onChange={(e) => setTags(e.target.value)} />
      </label>
      {service.integrationId && (
        <label className="text-sm">
          Integration credential ({service.integrationId})
          <input
            className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2"
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            placeholder="API key"
          />
        </label>
      )}
      <div className="mt-2 flex justify-between">
        <button type="button" className="text-sm text-rose-300" onClick={onRemove}>
          Remove
        </button>
        <button type="submit" className="rounded-lg bg-sky-400 px-4 py-2 text-sm text-black">
          Save
        </button>
      </div>
    </form>
  )
}

function CustomForm({ onSave }: { onSave: (service: Service) => void }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('http://')
  const [logo, setLogo] = useState('')
  const [tags, setTags] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const id = `custom-${Date.now()}`
    onSave({
      id,
      catalogId: null,
      name,
      url,
      logo: logo || '',
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      source: 'custom',
      integrationId: null,
      credential: '',
      live: null,
    })
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <input className="rounded-lg bg-white/10 px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="rounded-lg bg-white/10 px-3 py-2" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} required />
      <input
        className="rounded-lg bg-white/10 px-3 py-2"
        placeholder="Logo URL (leave blank for initial)"
        value={logo}
        onChange={(e) => setLogo(e.target.value)}
      />
      <input className="rounded-lg bg-white/10 px-3 py-2" placeholder="Tags" value={tags} onChange={(e) => setTags(e.target.value)} />
      <p className="text-xs text-slate-400">Custom logos here are a URL. Other variants try a file upload instead.</p>
      <button type="submit" className="rounded-lg bg-sky-400 py-2 text-black">
        Add
      </button>
    </form>
  )
}
