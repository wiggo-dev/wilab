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
        required
      />
      <input
        className="rounded-lg bg-white/10 px-3 py-2"
        placeholder="Logo URL (optional)"
        value={logo}
        onChange={(event) => setLogo(event.target.value)}
      />
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
