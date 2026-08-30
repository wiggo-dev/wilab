'use client'

import { useState, type FormEvent } from 'react'
import { parseTagsInput } from '@/lib/config/mutations'

export function CustomServiceForm({
  onSave,
}: {
  onSave: (input: { name: string; url: string; logo: string; tags: string[] }) => void | Promise<void>
}) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('http://')
  const [logo, setLogo] = useState('')
  const [tags, setTags] = useState('')
  const [fetchingFavicon, setFetchingFavicon] = useState(false)
  const [faviconError, setFaviconError] = useState<string | null>(null)

  async function tryFetchFavicon() {
    if (logo.trim()) return

    const trimmedUrl = url.trim()
    if (!trimmedUrl || trimmedUrl === 'http://' || trimmedUrl === 'https://') return

    setFetchingFavicon(true)
    setFaviconError(null)

    try {
      const response = await fetch('/api/favicon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl }),
      })
      const body = (await response.json()) as { ok: boolean; logo?: string; error?: string }

      if (body.ok && body.logo) {
        setLogo(body.logo)
      } else {
        setFaviconError(body.error ?? 'Could not fetch favicon')
      }
    } catch {
      setFaviconError('Could not fetch favicon')
    } finally {
      setFetchingFavicon(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    await onSave({
      name,
      url,
      logo,
      tags: parseTagsInput(tags),
    })
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <input
        className="rounded-lg bg-white/10 px-3 py-2"
        placeholder="Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <input
        className="rounded-lg bg-white/10 px-3 py-2"
        placeholder="URL"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        onBlur={() => void tryFetchFavicon()}
        required
      />
      <div className="flex flex-col gap-2">
        <input
          className="rounded-lg bg-white/10 px-3 py-2"
          placeholder="Logo URL (optional)"
          value={logo}
          onChange={(event) => {
            setLogo(event.target.value)
            setFaviconError(null)
          }}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm disabled:opacity-50"
            disabled={fetchingFavicon || !url.trim() || url.trim() === 'http://'}
            onClick={() => void tryFetchFavicon()}
          >
            {fetchingFavicon ? 'Fetching favicon…' : 'Use favicon'}
          </button>
          {faviconError && (
            <p className="text-xs text-slate-400" role="status">
              {faviconError}
            </p>
          )}
        </div>
      </div>
      <input
        className="rounded-lg bg-white/10 px-3 py-2"
        placeholder="Tags"
        value={tags}
        onChange={(event) => setTags(event.target.value)}
      />
      <button type="submit" className="rounded-lg bg-sky-400 py-2 text-black">
        Add
      </button>
    </form>
  )
}
