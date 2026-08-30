'use client'

import { useState } from 'react'
import type { WilabConfig } from '@/lib/config/types'

export function HostPresetsDialog({
  presets,
  onAdd,
  onUpdate,
  onRemove,
}: {
  presets: WilabConfig['hostPresets']
  onAdd: (host: string) => void | Promise<void>
  onUpdate: (index: number, host: string) => void | Promise<void>
  onRemove: (index: number) => void | Promise<void>
}) {
  const [drafts, setDrafts] = useState<Record<number, string>>(() =>
    Object.fromEntries(presets.map((host, index) => [index, host])),
  )
  const [newHost, setNewHost] = useState('')

  function submitNewHost() {
    const trimmed = newHost.trim()
    if (!trimmed) return
    void onAdd(trimmed)
    setNewHost('')
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-300">
        Host presets substitute <code className="text-sky-200">{'{host}'}</code> in catalog URLs when
        you add a service.
      </p>

      {presets.length === 0 ? (
        <p className="text-sm text-slate-400">No host presets yet.</p>
      ) : (
        presets.map((host, index) => {
          const draft = drafts[index] ?? host
          return (
            <div key={`${index}-${host}`} className="flex items-center gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm"
                value={draft}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, [index]: event.target.value }))
                }
              />
              <button
                type="button"
                className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                onClick={() => void onUpdate(index, draft)}
              >
                Save
              </button>
              <button
                type="button"
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs text-rose-300 hover:bg-white/10"
                onClick={() => void onRemove(index)}
              >
                Delete
              </button>
            </div>
          )
        })
      )}

      <div className="rounded-xl border border-dashed border-white/20 p-3">
        <p className="mb-2 text-sm text-slate-300">Add host preset</p>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            submitNewHost()
          }}
        >
          <input
            className="min-w-0 flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm"
            placeholder="nas.local or 192.168.1.10"
            value={newHost}
            onChange={(event) => setNewHost(event.target.value)}
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-sky-400 px-3 py-2 text-sm text-black disabled:opacity-50"
            disabled={!newHost.trim()}
          >
            Add
          </button>
        </form>
      </div>
    </div>
  )
}
