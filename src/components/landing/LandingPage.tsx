'use client'

import { useMemo, useState } from 'react'
import type { WilabConfig } from '@/lib/config/types'
import { allTags, buildSearchUrl, gridServices, pinnedServices } from '@/lib/landing/view-model'
import { ServiceTile } from './ServiceTile'
import { TagChip } from './TagChip'

type LandingPageProps = {
  config: WilabConfig
}

export function LandingPage({ config }: LandingPageProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchProviderId, setSearchProviderId] = useState(config.activeSearchProviderId)

  const tags = useMemo(() => allTags(config.services), [config.services])
  const pinned = useMemo(
    () => pinnedServices(config.services, config.pinnedOrder),
    [config.pinnedOrder, config.services],
  )
  const grid = useMemo(
    () => gridServices(config.services, config.gridOrder, activeTag),
    [activeTag, config.gridOrder, config.services],
  )

  function toggleTag(tag: string) {
    setActiveTag((current) => (current === tag ? null : tag))
  }

  function submitSearch() {
    const provider = config.searchProviders.find((entry) => entry.id === searchProviderId)
    if (!provider) return

    const url = buildSearchUrl(provider.template, searchQuery)
    if (!url) return

    window.open(url, '_blank', 'noopener')
  }

  return (
    <div className="min-h-svh bg-[#0b1220] pb-36 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.12),_transparent_55%)]" />
      <header role="banner" className="relative border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-2.5">
          <p className="shrink-0 text-sm tracking-[0.3em] text-sky-300/80 uppercase">wilab</p>
          <form
            className="flex min-w-0 flex-1 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/15"
            onSubmit={(event) => {
              event.preventDefault()
              submitSearch()
            }}
          >
            <select
              className="bg-transparent px-3 text-sm outline-none"
              value={searchProviderId}
              onChange={(event) => setSearchProviderId(event.target.value)}
              aria-label="Search provider"
            >
              {config.searchProviders.map((provider) => (
                <option key={provider.id} value={provider.id} className="text-black">
                  {provider.name}
                </option>
              ))}
            </select>
            <input
              className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-slate-400"
              placeholder="Search the web"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search query"
            />
          </form>
        </div>
        <div className="mx-auto flex max-w-5xl flex-wrap gap-1.5 px-6 pb-2">
          <TagChip active={activeTag == null} onClick={() => setActiveTag(null)}>
            All
          </TagChip>
          {tags.map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              active={activeTag === tag}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </TagChip>
          ))}
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 pt-5">
        <section>
          <h2 className="mb-2 text-xs tracking-[0.25em] text-sky-200/70 uppercase">Pinned</h2>
          <div className="flex flex-wrap gap-2">
            {pinned.map((service) => (
              <ServiceTile
                key={service.id}
                service={service}
                compact
                zone="pinned"
                activeTag={activeTag}
                onTagClick={toggleTag}
              />
            ))}
          </div>
        </section>
        <section className="mt-5">
          <h2 className="mb-2 text-xs tracking-[0.25em] text-sky-200/70 uppercase">Main grid</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {grid.map((service) => (
              <ServiceTile
                key={service.id}
                service={service}
                zone="grid"
                activeTag={activeTag}
                onTagClick={toggleTag}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
