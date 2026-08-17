import { useState, type DragEvent, type FormEvent } from 'react'
import type { LandingApi, Service } from '../types'

export const variantName = 'Status board'

export function VariantC({ api }: { api: LandingApi }) {
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const drawer = api.state.services.find((s) => s.id === drawerId) ?? null

  return (
    <div className="min-h-svh bg-[#0c0d10] pb-36 font-sans text-[#e6e8ee]">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <span className="font-mono text-xs tracking-widest text-[#7dd3fc] uppercase">wilab</span>
        <form
          className="flex min-w-0 flex-1 items-center gap-2 rounded border border-white/10 bg-[#14161c] px-2"
          onSubmit={(e) => {
            e.preventDefault()
            api.submitSearch()
          }}
        >
          <select
            className="bg-transparent py-2 font-mono text-xs outline-none"
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
            className="min-w-0 flex-1 bg-transparent py-2 font-mono text-sm outline-none"
            placeholder="query"
            value={api.state.searchQuery}
            onChange={(e) => api.setSearchQuery(e.target.value)}
          />
        </form>
        <select
          className="rounded border border-white/10 bg-[#14161c] px-2 py-2 font-mono text-xs"
          value={api.state.activeTag ?? ''}
          onChange={(e) => api.setTag(e.target.value || null)}
        >
          <option value="">tags: all</option>
          {api.allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={api.toggleEditMode}
          className={`rounded px-3 py-2 font-mono text-xs ${api.state.editMode ? 'bg-[#7dd3fc] text-black' : 'border border-white/15'}`}
        >
          {api.state.editMode ? 'EDIT ON' : 'EDIT'}
        </button>
      </header>

      <section className="grid grid-cols-1 gap-px bg-white/10 md:grid-cols-2 xl:grid-cols-4">
        {api.pinnedServices.map((service) => (
          <article
            key={service.id}
            draggable={api.state.editMode}
            onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ zone: 'pinned', id: service.id }))}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => drop(e, 'pinned', service.id, api)}
            className="bg-[#0c0d10] p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Logo service={service} />
                <a href={service.url} className="text-sm text-[#e6e8ee] no-underline hover:text-[#7dd3fc]">
                  {service.name}
                </a>
              </div>
              <button type="button" className="text-[#fbbf24]" onClick={() => api.togglePin(service.id)}>
                ★
              </button>
            </div>
            <p className="mt-4 font-mono text-3xl tracking-tight text-[#7dd3fc]">{service.live ?? '—'}</p>
            <p className="mt-1 font-mono text-[10px] tracking-widest text-white/40 uppercase">live</p>
          </article>
        ))}
      </section>

      <section className="px-4 pt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">Main grid</h2>
          {api.state.editMode && (
            <button type="button" className="font-mono text-xs text-[#7dd3fc]" onClick={() => setAdding((v) => !v)}>
              {adding ? 'close' : '+ add'}
            </button>
          )}
        </div>
        {adding && (
          <AddPanel
            api={api}
            onDone={() => setAdding(false)}
            onAdded={(id) => {
              setAdding(false)
              setDrawerId(id)
            }}
          />
        )}
        <table className="w-full border-collapse text-left text-sm">
          <thead className="font-mono text-[10px] tracking-widest text-white/35 uppercase">
            <tr className="border-b border-white/10">
              {api.state.editMode && <th className="w-8 py-2" />}
              <th className="py-2">Service</th>
              <th className="py-2">URL</th>
              <th className="py-2">Tags</th>
              <th className="py-2">Live</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {api.gridServices.map((service) => (
              <tr
                key={service.id}
                draggable={api.state.editMode}
                onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ zone: 'grid', id: service.id }))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => drop(e, 'grid', service.id, api)}
                className={`border-b border-white/5 ${api.state.editMode ? 'cursor-grab' : ''} hover:bg-white/5`}
              >
                {api.state.editMode && <td className="text-white/30">⠿</td>}
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <Logo service={service} />
                    {service.name}
                    {api.state.pinnedOrder.includes(service.id) && <span className="text-[10px] text-[#fbbf24]">PIN</span>}
                  </div>
                </td>
                <td className="max-w-[16rem] truncate font-mono text-xs text-white/50">
                  <a href={service.url} className="text-inherit">
                    {service.url}
                  </a>
                </td>
                <td className="font-mono text-xs text-white/45">{service.tags.join(' · ') || '—'}</td>
                <td className="font-mono text-xs text-[#7dd3fc]">{service.live ?? '—'}</td>
                <td className="text-right">
                  <button type="button" className="mr-2 text-white/40" onClick={() => api.togglePin(service.id)}>
                    ★
                  </button>
                  {api.state.editMode && (
                    <button type="button" className="font-mono text-xs text-[#7dd3fc]" onClick={() => setDrawerId(service.id)}>
                      creds
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {drawer && (
        <div className="fixed inset-y-0 right-0 z-40 w-96 border-l border-white/10 bg-[#14161c] p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-mono text-xs tracking-widest uppercase">Drawer · {drawer.name}</h3>
            <button type="button" onClick={() => setDrawerId(null)}>
              ✕
            </button>
          </div>
          <DrawerForm
            key={drawer.id}
            service={drawer}
            onSave={(patch) => {
              api.updateService(drawer.id, patch)
              setDrawerId(null)
            }}
            onRemove={() => {
              api.removeService(drawer.id)
              setDrawerId(null)
            }}
          />
        </div>
      )}
    </div>
  )
}

function drop(e: DragEvent, zone: 'grid' | 'pinned', beforeId: string, api: LandingApi) {
  const raw = e.dataTransfer.getData('text/plain')
  if (!raw) return
  const payload = JSON.parse(raw) as { zone: string; id: string }
  if (payload.zone !== zone) return
  if (zone === 'grid') api.reorderGrid(payload.id, beforeId)
  else api.reorderPinned(payload.id, beforeId)
}

function AddPanel({ api, onDone, onAdded }: { api: LandingApi; onDone: () => void; onAdded: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const matches = api.catalog.filter((entry) => {
    if (!q) return true
    return entry.name.toLowerCase().includes(q) || entry.tags.some((tag) => tag.toLowerCase().includes(q))
  })

  return (
    <div className="mb-4 rounded border border-white/10 p-3">
      <p className="mb-2 font-mono text-[10px] tracking-widest text-white/40 uppercase">Catalog</p>
      <input
        autoFocus
        className="mb-2 w-full rounded border border-white/15 bg-transparent px-2 py-1 font-mono text-xs"
        placeholder="search catalog"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {matches.map((entry) => {
          const count = api.state.services.filter((s) => s.catalogId === entry.id).length
          return (
            <button
              key={entry.id}
              type="button"
              className="rounded border border-white/15 px-2 py-1 font-mono text-xs hover:border-[#7dd3fc]"
              onClick={() => {
                const id = api.addFromCatalog(entry.id)
                if (id) onAdded(id)
                else onDone()
              }}
            >
              {entry.name}
              {count > 0 ? ` · ${count}` : ''}
            </button>
          )
        })}
        {matches.length === 0 && <p className="font-mono text-xs text-white/40">no matches</p>}
      </div>
      <CustomUpload
        onSave={(service) => {
          api.addService(service)
          onDone()
        }}
      />
    </div>
  )
}

function CustomUpload({ onSave }: { onSave: (service: Service) => void }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('http://')
  const [logo, setLogo] = useState('')

  function onFile(file: File | undefined) {
    if (!file) return
    setLogo(URL.createObjectURL(file))
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    onSave({
      id: `custom-${Date.now()}`,
      catalogId: null,
      name,
      url,
      logo,
      tags: [],
      source: 'custom',
      integrationId: null,
      credential: '',
      live: null,
    })
  }

  return (
    <form className="mt-3 grid grid-cols-2 gap-2" onSubmit={onSubmit}>
      <input className="rounded border border-white/15 bg-transparent px-2 py-1 font-mono text-xs" placeholder="custom name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="rounded border border-white/15 bg-transparent px-2 py-1 font-mono text-xs" placeholder="url" value={url} onChange={(e) => setUrl(e.target.value)} required />
      <label className="col-span-2 font-mono text-[10px] text-white/40">
        Logo file (in-memory object URL — not persisted)
        <input className="mt-1 block text-xs" type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      <button type="submit" className="col-span-2 rounded bg-[#7dd3fc] py-1 font-mono text-xs text-black">
        add custom service
      </button>
    </form>
  )
}

function DrawerForm({
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
      <input className="rounded border border-white/15 bg-transparent px-2 py-2 font-mono text-sm" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="rounded border border-white/15 bg-transparent px-2 py-2 font-mono text-sm" value={url} onChange={(e) => setUrl(e.target.value)} />
      <input className="rounded border border-white/15 bg-transparent px-2 py-2 font-mono text-sm" value={tags} onChange={(e) => setTags(e.target.value)} />
      {service.integrationId ? (
        <label className="font-mono text-xs text-white/50">
          {service.integrationId} credential
          <input className="mt-1 w-full rounded border border-white/15 bg-transparent px-2 py-2" value={credential} onChange={(e) => setCredential(e.target.value)} />
        </label>
      ) : (
        <p className="font-mono text-xs text-white/35">No integration on this service.</p>
      )}
      <button type="submit" className="rounded bg-[#7dd3fc] py-2 font-mono text-xs text-black">
        save
      </button>
      <button type="button" className="font-mono text-xs text-rose-400" onClick={onRemove}>
        remove
      </button>
    </form>
  )
}

function Logo({ service }: { service: Service }) {
  if (!service.logo) {
    return <div className="flex h-6 w-6 items-center justify-center rounded bg-white/10 text-[10px]">{service.name.slice(0, 1)}</div>
  }
  return <img src={service.logo} alt="" className="h-6 w-6 object-contain" />
}
