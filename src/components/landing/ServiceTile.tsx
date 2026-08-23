'use client'

import type { DragEvent } from 'react'
import type { DisplayService } from '@/lib/config/types'
import { tagClass } from '@/lib/ui/tag-colors'

export function ServiceLogo({
  service,
  className,
}: {
  service: Pick<DisplayService, 'name' | 'logo'>
  className: string
}) {
  if (!service.logo) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-white/15 text-lg font-semibold ${className}`}
      >
        {service.name.slice(0, 1)}
      </div>
    )
  }

  return <img src={service.logo} alt="" className={`object-contain ${className}`} />
}

export function ServiceTile({
  service,
  compact,
  zone,
  activeTag,
  editMode,
  pinned,
  onTagClick,
  onEdit,
  onTogglePin,
  onReorder,
}: {
  service: DisplayService
  compact?: boolean
  zone: 'grid' | 'pinned'
  activeTag: string | null
  editMode?: boolean
  pinned?: boolean
  onTagClick: (tag: string) => void
  onEdit?: () => void
  onTogglePin?: () => void
  onReorder?: (draggedId: string) => void
}) {
  function onDragStart(event: DragEvent) {
    event.dataTransfer.setData('text/plain', JSON.stringify({ zone, id: service.id }))
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    const raw = event.dataTransfer.getData('text/plain')
    if (!raw || !onReorder) return
    const payload = JSON.parse(raw) as { zone: 'grid' | 'pinned'; id: string }
    if (payload.zone !== zone || payload.id === service.id) return
    onReorder(payload.id)
  }

  const inner = (
    <>
      <ServiceLogo service={service} className={compact ? 'h-7 w-7' : 'h-10 w-10'} />
      <div className={`truncate ${compact ? 'mt-1 text-[11px]' : 'mt-1.5 text-xs'}`}>{service.name}</div>
    </>
  )

  return (
    <div
      draggable={editMode}
      onDragStart={onDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className={`group relative flex flex-col items-center rounded-2xl bg-white/8 p-2 ring-1 ${compact ? 'h-32 w-28 justify-between' : 'aspect-square justify-center'} ${zone === 'pinned' ? 'ring-sky-400/40' : 'ring-white/10'} ${editMode ? 'cursor-grab' : ''}`}
    >
      {editMode && onTogglePin && (
        <button
          type="button"
          className={`absolute top-2 left-2 text-sm ${pinned ? 'text-amber-300' : 'hidden text-slate-400 group-hover:block'}`}
          onClick={onTogglePin}
          aria-label={pinned ? 'Unpin' : 'Pin'}
        >
          ★
        </button>
      )}
      {editMode && onEdit ? (
        <button
          type="button"
          className="flex min-h-0 w-full flex-1 flex-col items-center justify-center"
          onClick={onEdit}
        >
          {inner}
        </button>
      ) : (
        <a
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-0 w-full flex-1 flex-col items-center justify-center text-inherit no-underline"
        >
          {inner}
        </a>
      )}
      {service.tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-0.5 pt-1">
          {service.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`rounded-full px-1.5 py-px text-[9px] ${tagClass(tag, activeTag === tag)}`}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onTagClick(tag)
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
