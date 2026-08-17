import { useEffect } from 'react'

export const VARIANTS = [
  { key: 'A', name: 'Tile wall' },
  { key: 'B', name: 'Launcher' },
  { key: 'C', name: 'Status board' },
] as const

export type VariantKey = (typeof VARIANTS)[number]['key']

export function isVariantKey(value: string): value is VariantKey {
  return VARIANTS.some((v) => v.key === value)
}

type Props = {
  current: VariantKey
  onChange: (key: VariantKey) => void
  stateDump: unknown
}

export function PrototypeSwitcher({ current, onChange, stateDump }: Props) {
  const index = VARIANTS.findIndex((v) => v.key === current)
  const label = VARIANTS[index] ?? VARIANTS[0]

  function cycle(delta: number) {
    const next = VARIANTS[(index + delta + VARIANTS.length) % VARIANTS.length]
    onChange(next.key)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) {
        return
      }
      if (e.key === 'ArrowLeft') cycle(-1)
      if (e.key === 'ArrowRight') cycle(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-3xl flex-col gap-2">
        <details className="rounded-xl bg-black/90 text-left text-lime-300 shadow-2xl ring-2 ring-yellow-300">
          <summary className="cursor-pointer px-3 py-2 font-mono text-xs tracking-wide">
            state — click to expand
          </summary>
          <pre className="max-h-56 overflow-auto px-3 pb-3 font-mono text-[11px] leading-snug text-lime-200">
            {JSON.stringify(stateDump, null, 2)}
          </pre>
        </details>
        <div className="flex items-center gap-2 rounded-full bg-yellow-300 px-2 py-1.5 text-black shadow-2xl ring-2 ring-black">
          <button type="button" className="rounded-full px-3 py-1 text-lg font-bold hover:bg-black/10" onClick={() => cycle(-1)} aria-label="Previous variant">
            ←
          </button>
          <div className="min-w-48 text-center font-mono text-sm font-bold">
            {label.key} — {label.name}
          </div>
          <button type="button" className="rounded-full px-3 py-1 text-lg font-bold hover:bg-black/10" onClick={() => cycle(1)} aria-label="Next variant">
            →
          </button>
        </div>
      </div>
    </div>
  )
}
