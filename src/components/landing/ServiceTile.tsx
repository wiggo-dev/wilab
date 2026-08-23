'use client'

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
  onTagClick,
}: {
  service: DisplayService
  compact?: boolean
  zone: 'grid' | 'pinned'
  activeTag: string | null
  onTagClick: (tag: string) => void
}) {
  return (
    <div
      className={`group relative flex flex-col items-center rounded-2xl bg-white/8 p-2 ring-1 ${compact ? 'h-32 w-28 justify-between' : 'aspect-square justify-center'} ${zone === 'pinned' ? 'ring-sky-400/40' : 'ring-white/10'}`}
    >
      <a
        href={service.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-0 w-full flex-1 flex-col items-center justify-center text-inherit no-underline"
      >
        <ServiceLogo service={service} className={compact ? 'h-7 w-7' : 'h-10 w-10'} />
        <div className={`truncate ${compact ? 'mt-1 text-[11px]' : 'mt-1.5 text-xs'}`}>{service.name}</div>
      </a>
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
