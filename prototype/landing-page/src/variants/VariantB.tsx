import { useMemo, useState, type DragEvent, type FormEvent } from 'react'
import type { LandingApi, Service } from '../types'

export const variantName = 'Launcher'

export function VariantB({ api }: { api: LandingApi }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const selected = api.state.services.find((s) => s.id === selectedId) ?? null

  const paletteItems = useMemo(() => {
    const q = paletteQuery.toLowerCase()
    return api.catalog.filter((s) => s.name.toLowerCase().includes(q))
  }, [api.catalog, paletteQuery])

  return (
    <div className="flex min-h-svh bg-[#f3efe6] pb-36 text-[#1c1917]">
      <aside className="flex w-72 shrink-0 flex-col border-r border-[#ddd4c4] bg-[#ebe4d6]">
        <div className="px-5 pt-8 pb-4">
          <p className="text-xs tracking-[0.2em] text-[#8a7d68] uppercase">Pinned</p>
        </div>
        <ul className="flex-1 px-2">
          {api.pinnedServices.map((service) => (
            <li key={service.id}>
              <SidebarRow
                service={service}
                active={selectedId === service.id}
                api={api}
                onSelect={() => setSelectedId(service.id)}
              />
            </li>
          ))}
        </ul>
        <div className="border-t border-[#ddd4c4] px-5 py-4">
          <p className="mb-2 text-xs tracking-[0.2em] text-[#8a7d68] uppercase">Tags</p>
          <button
            type="button"
            onClick={() => api.setTag(null)}
            className={`mb-1 block text-left text-sm ${api.state.activeTag == null ? 'font-semibold' : 'text-[#8a7d68]'}`}
          >
            All services
          </button>
          {api.allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => api.setTag(tag)}
              className={`mb-1 block text-left text-sm ${api.state.activeTag === tag ? 'font-semibold' : 'text-[#8a7d68]'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </aside>

      <main className="relative min-w-0 flex-1 px-10 pt-12">
        <div className="mb-8 flex items-start justify-between gap-4">
          <form
            className="flex-1"
            onSubmit={(e) => {
              e.preventDefault()
              api.submitSearch()
            }}
          >
            <div className="flex items-end gap-3">
              <select
                className="bg-transparent text-sm text-[#8a7d68] outline-none"
                value={api.state.searchProviderId}
                onChange={(e) => api.setSearchProviderId(e.target.value)}
              >
                {api.state.searchProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {api.state.editMode && (
                <CustomProviderNote api={api} />
              )}
            </div>
            <input
              className="mt-2 w-full border-b border-[#1c1917] bg-transparent pb-2 text-4xl outline-none placeholder:text-[#c4b8a4]"
              placeholder="Search or jump…"
              value={api.state.searchQuery}
              onChange={(e) => api.setSearchQuery(e.target.value)}
            />
          </form>
          <button
            type="button"
            onClick={api.toggleEditMode}
            className={`rounded-md px-3 py-1 text-sm ${api.state.editMode ? 'bg-[#1c1917] text-[#f3efe6]' : 'ring-1 ring-[#1c1917]/20'}`}
          >
            {api.state.editMode ? 'Editing' : 'Edit'}
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs tracking-[0.2em] text-[#8a7d68] uppercase">Main grid</h2>
          {api.state.editMode && (
            <button type="button" className="text-sm underline" onClick={() => setPaletteOpen(true)}>
              Add service
            </button>
          )}
        </div>
        <ul>
          {api.gridServices.map((service) => (
            <ListRow
              key={service.id}
              service={service}
              pinned={api.state.pinnedOrder.includes(service.id)}
              selected={selectedId === service.id}
              api={api}
              onSelect={() => setSelectedId(service.id)}
            />
          ))}
        </ul>
      </main>

      {api.state.editMode && selected && (
        <Inspector
          key={selected.id}
          service={selected}
          api={api}
          onClose={() => setSelectedId(null)}
        />
      )}

      {paletteOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 pt-24" onClick={() => setPaletteOpen(false)}>
          <div className="w-full max-w-lg rounded-xl bg-[#f3efe6] p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              className="w-full border-b border-[#1c1917] bg-transparent py-2 text-lg outline-none"
              placeholder="Add from catalog…"
              value={paletteQuery}
              onChange={(e) => setPaletteQuery(e.target.value)}
            />
            <ul className="mt-3 max-h-64 overflow-auto">
              {paletteItems.map((entry) => {
                const count = api.state.services.filter((s) => s.catalogId === entry.id).length
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-2 py-2 text-left hover:bg-[#ebe4d6]"
                      onClick={() => {
                        const id = api.addFromCatalog(entry.id)
                        setPaletteOpen(false)
                        setPaletteQuery('')
                        if (id) setSelectedId(id)
                      }}
                    >
                      <Logo service={entry} />
                      <span className="flex-1">{entry.name}</span>
                      {count > 0 && <span className="text-xs text-[#8a7d68]">{count} on page</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
            <CustomInline
              onSave={(service) => {
                api.addService(service)
                setPaletteOpen(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function CustomProviderNote({ api }: { api: LandingApi }) {
  const [template, setTemplate] = useState('https://example.com/search?q={q}')
  return (
    <button
      type="button"
      className="text-xs text-[#8a7d68] underline"
      onClick={() => {
        const id = `custom-${Date.now()}`
        api.addSearchProvider({ id, name: 'Custom', template })
        setTemplate('https://example.com/search?q={q}')
      }}
    >
      + custom provider ({'{q}'} in URL)
    </button>
  )
}

function SidebarRow({
  service,
  active,
  api,
  onSelect,
}: {
  service: Service
  active: boolean
  api: LandingApi
  onSelect: () => void
}) {
  return (
    <div
      draggable={api.state.editMode}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', service.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        api.reorderPinned(e.dataTransfer.getData('text/plain'), service.id)
      }}
      className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 ${active ? 'bg-[#1c1917] text-[#f3efe6]' : 'hover:bg-[#ddd4c4]'} ${api.state.editMode ? 'cursor-grab' : ''}`}
    >
      <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={onSelect}>
        <Logo service={service} />
        <span className="truncate">{service.name}</span>
      </button>
      <button type="button" className="text-amber-500" onClick={() => api.togglePin(service.id)} aria-label="Unpin">
        ★
      </button>
    </div>
  )
}

function ListRow({
  service,
  pinned,
  selected,
  api,
  onSelect,
}: {
  service: Service
  pinned: boolean
  selected: boolean
  api: LandingApi
  onSelect: () => void
}) {
  function onDrop(e: DragEvent) {
    e.preventDefault()
    api.reorderGrid(e.dataTransfer.getData('text/plain'), service.id)
  }
  return (
    <li
      draggable={api.state.editMode}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', service.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={`flex items-center gap-4 border-b border-[#ddd4c4] py-3 ${selected ? 'bg-[#ebe4d6]' : ''} ${api.state.editMode ? 'cursor-grab' : ''}`}
    >
      <button type="button" className="flex min-w-0 flex-1 items-center gap-4 text-left" onClick={onSelect}>
        <Logo service={service} />
        <div className="min-w-0">
          <div className="font-medium">{service.name}</div>
          <div className="truncate text-sm text-[#8a7d68]">{service.url}</div>
        </div>
      </button>
      {service.live && <span className="text-sm text-[#4d7c0f]">{service.live}</span>}
      <button type="button" className={pinned ? 'text-amber-600' : 'text-[#c4b8a4]'} onClick={() => api.togglePin(service.id)}>
        ★
      </button>
      {!api.state.editMode && (
        <a href={service.url} className="text-sm text-[#8a7d68]">
          Open
        </a>
      )}
    </li>
  )
}

function Inspector({ service, api, onClose }: { service: Service; api: LandingApi; onClose: () => void }) {
  const [name, setName] = useState(service.name)
  const [url, setUrl] = useState(service.url)
  const [credential, setCredential] = useState(service.credential)

  return (
    <aside className="w-80 shrink-0 border-l border-[#ddd4c4] bg-[#fffaf0] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm tracking-[0.2em] uppercase">Inspector</h3>
        <button type="button" onClick={onClose}>
          ✕
        </button>
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          api.updateService(service.id, { name, url, credential })
        }}
      >
        <input className="border-b border-[#1c1917] bg-transparent py-1 outline-none" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="border-b border-[#1c1917] bg-transparent py-1 outline-none" value={url} onChange={(e) => setUrl(e.target.value)} />
        {service.integrationId && (
          <label className="text-sm text-[#8a7d68]">
            Credential
            <input
              className="mt-1 w-full border-b border-[#1c1917] bg-transparent py-1 outline-none"
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
            />
          </label>
        )}
        <button type="submit" className="mt-2 bg-[#1c1917] py-2 text-sm text-[#f3efe6]">
          Save
        </button>
        <button type="button" className="text-sm text-rose-700" onClick={() => api.removeService(service.id)}>
          Remove from page
        </button>
      </form>
    </aside>
  )
}

function CustomInline({ onSave }: { onSave: (service: Service) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('http://')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    onSave({
      id: `custom-${Date.now()}`,
      catalogId: null,
      name,
      url,
      logo: '',
      tags: [],
      source: 'custom',
      integrationId: null,
      credential: '',
      live: null,
    })
  }

  if (!open) {
    return (
      <button type="button" className="mt-3 text-sm underline" onClick={() => setOpen(true)}>
        Custom service…
      </button>
    )
  }
  return (
    <form className="mt-3 flex flex-col gap-2" onSubmit={onSubmit}>
      <input className="border-b bg-transparent py-1 outline-none" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="border-b bg-transparent py-1 outline-none" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} required />
      <button type="submit" className="bg-[#1c1917] py-1 text-sm text-[#f3efe6]">
        Add custom
      </button>
    </form>
  )
}

function Logo({ service }: { service: Service }) {
  if (!service.logo) {
    return <div className="flex h-8 w-8 items-center justify-center rounded bg-[#1c1917] text-xs text-[#f3efe6]">{service.name.slice(0, 1)}</div>
  }
  return <img src={service.logo} alt="" className="h-8 w-8 object-contain" />
}
