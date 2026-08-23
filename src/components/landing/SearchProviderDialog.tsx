'use client'

import { useState } from 'react'
import type { SearchProvider } from '@/lib/config/types'

export function SearchProviderDialog({
  providers,
  activeProviderId,
  onSave,
  onAdd,
  onSetActive,
}: {
  providers: SearchProvider[]
  activeProviderId: string
  onSave: (id: string, patch: Partial<Pick<SearchProvider, 'name' | 'template'>>) => void | Promise<void>
  onAdd: (provider: SearchProvider) => void | Promise<void>
  onSetActive: (id: string) => void | Promise<void>
}) {
  const [drafts, setDrafts] = useState<Record<string, SearchProvider>>(() =>
    Object.fromEntries(providers.map((provider) => [provider.id, { ...provider }])),
  )
  const [newName, setNewName] = useState('')
  const [newTemplate, setNewTemplate] = useState('https://search.example?q={q}')

  return (
    <div className="flex flex-col gap-4">
      {providers.map((provider) => {
        const draft = drafts[provider.id] ?? provider
        return (
          <div key={provider.id} className="rounded-xl bg-white/5 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{provider.id}</span>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="radio"
                  name="active-provider"
                  checked={activeProviderId === provider.id}
                  onChange={() => void onSetActive(provider.id)}
                />
                Active
              </label>
            </div>
            <input
              className="mb-2 w-full rounded-lg bg-white/10 px-3 py-2 text-sm"
              value={draft.name}
              onChange={(event) =>
                setDrafts((current) => ({
                  ...current,
                  [provider.id]: { ...draft, name: event.target.value },
                }))
              }
            />
            <input
              className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm"
              value={draft.template}
              onChange={(event) =>
                setDrafts((current) => ({
                  ...current,
                  [provider.id]: { ...draft, template: event.target.value },
                }))
              }
            />
            <button
              type="button"
              className="mt-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
              onClick={() => void onSave(provider.id, drafts[provider.id] ?? provider)}
            >
              Save provider
            </button>
          </div>
        )
      })}

      <div className="rounded-xl border border-dashed border-white/20 p-3">
        <p className="mb-2 text-sm text-slate-300">Add custom provider</p>
        <input
          className="mb-2 w-full rounded-lg bg-white/10 px-3 py-2 text-sm"
          placeholder="Name"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
        />
        <input
          className="mb-2 w-full rounded-lg bg-white/10 px-3 py-2 text-sm"
          placeholder="URL template with {q}"
          value={newTemplate}
          onChange={(event) => setNewTemplate(event.target.value)}
        />
        <button
          type="button"
          className="rounded-lg bg-sky-400 px-3 py-1.5 text-sm text-black"
          onClick={() => {
            const id = `custom-${crypto.randomUUID().slice(0, 8)}`
            void onAdd({ id, name: newName, template: newTemplate })
            setNewName('')
          }}
        >
          Add provider
        </button>
      </div>
    </div>
  )
}
