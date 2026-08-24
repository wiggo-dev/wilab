'use client'

import type { DragEvent } from 'react'
import type { DisplayService } from '@/lib/config/types'
import type { GlanceResult } from '@/lib/integrations/types'
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
  isDragging,
  isDropTarget,
  onTagClick,
  onEdit,
  onTogglePin,
  onDelete,
  onDragBegin,
  onDragHover,
  onDragEnd,
  onDropCommit,
  glance,
}: {
  service: DisplayService
  compact?: boolean
  zone: 'grid' | 'pinned'
  activeTag: string | null
  editMode?: boolean
  pinned?: boolean
  isDragging?: boolean
  isDropTarget?: boolean
  onTagClick: (tag: string) => void
  onEdit?: () => void
  onTogglePin?: () => void
  onDelete?: () => void
  onDragBegin?: (zone: 'grid' | 'pinned', id: string) => void
  onDragHover?: (zone: 'grid' | 'pinned', id: string) => void
  onDragEnd?: () => void
  onDropCommit?: () => void
  glance?: GlanceResult
}) {
  function onDragStart(event: DragEvent) {
    event.dataTransfer.setData('text/plain', JSON.stringify({ zone, id: service.id }))
    event.dataTransfer.effectAllowed = 'move'
    onDragBegin?.(zone, service.id)
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    onDragHover?.(zone, service.id)
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    onDropCommit?.()
  }

  const tileContent = (
    <>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-1">
        <ServiceLogo service={service} className={compact ? 'h-7 w-7' : 'h-10 w-10'} />
        <div className={`truncate ${compact ? 'mt-1 text-[11px]' : 'mt-1.5 text-xs'}`}>{service.name}</div>
      </div>
      <div className="flex h-5 w-full shrink-0 items-center justify-center pb-1">
        {glance ? (
          <div
            className={`max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
              glance.status === 'unavailable'
                ? 'bg-amber-400/20 text-amber-200'
                : 'bg-emerald-400/20 text-emerald-200'
            } ${glance.status === 'stale' ? 'opacity-50' : ''}`}
          >
            {glance.text}
          </div>
        ) : null}
      </div>
    </>
  )

  const interactiveClassName =
    'flex min-h-0 w-full flex-1 flex-col items-center text-inherit no-underline'

  return (
    <div
      draggable={editMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={() => onDragEnd?.()}
      onDrop={onDrop}
      className={`group relative flex flex-col items-center rounded-2xl bg-white/8 p-2 ring-1 transition-[transform,box-shadow,opacity] duration-150 ${compact ? 'h-32 w-28' : 'aspect-square'} ${zone === 'pinned' ? 'ring-sky-400/40' : 'ring-white/10'} ${editMode ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'opacity-40 scale-95' : ''} ${isDropTarget ? 'ring-2 ring-amber-300/80 shadow-[0_0_0_4px_rgba(251,191,36,0.15)]' : ''}`}
    >
      {onTogglePin && (
        <button
          type="button"
          className={`absolute top-2 left-2 z-10 text-sm ${pinned ? 'text-amber-300' : 'hidden text-slate-400 group-hover:block'}`}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onTogglePin()
          }}
          aria-label={pinned ? 'Unpin' : 'Pin'}
        >
          ★
        </button>
      )}
      {editMode && onDelete && (
        <button
          type="button"
          className="absolute top-2 right-2 z-10 rounded-md bg-black/40 p-1 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onDelete()
          }}
          onMouseDown={(event) => event.stopPropagation()}
          aria-label={`Delete ${service.name}`}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
            <path
              d="M3.5 4.5h9M6 4.5V3.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M5 4.5l.5 8.5h5L11 4.5"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      {editMode && onEdit ? (
        <button
          type="button"
          className={interactiveClassName}
          onClick={onEdit}
          aria-label={`Edit ${service.name}`}
        >
          {tileContent}
        </button>
      ) : (
        <a href={service.url} target="_blank" rel="noopener noreferrer" className={interactiveClassName}>
          {tileContent}
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
