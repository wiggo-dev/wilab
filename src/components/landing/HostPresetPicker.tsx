'use client'

import type { CatalogEntry } from '@/lib/catalog/types'

export function HostPresetPicker({
  entry,
  presets,
  onPick,
  onManual,
  onBack,
}: {
  entry: CatalogEntry
  presets: string[]
  onPick: (host: string) => void
  onManual: () => void
  onBack: () => void
}) {
  return (
    <>
      <p className="mb-3 text-sm text-slate-300">
        Choose a host for <span className="font-medium text-white">{entry.name}</span>. The URL
        template <code className="text-sky-200">{entry.defaultUrl}</code> will use your selection.
      </p>
      <div className="flex flex-col gap-2">
        {presets.map((host) => (
          <button
            key={host}
            type="button"
            className="rounded-xl bg-white/5 px-4 py-3 text-left text-sm hover:bg-white/10"
            onClick={() => onPick(host)}
          >
            {host}
          </button>
        ))}
      </div>
      <div className="mt-4 flex justify-between gap-2">
        <button
          type="button"
          className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          onClick={onManual}
        >
          Enter manually
        </button>
      </div>
    </>
  )
}
