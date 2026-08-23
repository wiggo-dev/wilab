'use client'

import type { ReactNode } from 'react'
import { tagClass } from '@/lib/ui/tag-colors'

export function TagChip({
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
