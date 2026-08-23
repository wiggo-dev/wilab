'use client'

import { useState, type FormEvent } from 'react'
import type { DisplayService } from '@/lib/config/types'
import { parseTagsInput } from '@/lib/config/mutations'

export function ServiceForm({
  service,
  onSave,
  onRemove,
}: {
  service: DisplayService
  onSave: (
    patch: Pick<DisplayService, 'name' | 'url' | 'logo' | 'tags' | 'integration'>,
  ) => void | Promise<void>
  onRemove: () => void | Promise<void>
}) {
  const [name, setName] = useState(service.name)
  const [url, setUrl] = useState(service.url)
  const [logo, setLogo] = useState(service.logo)
  const [tags, setTags] = useState(service.tags.join(', '))
  const [apiKey, setApiKey] = useState(service.integration?.apiKey ?? '')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    await onSave({
      name,
      url,
      logo,
      tags: parseTagsInput(tags),
      integration: service.integration ? { ...service.integration, apiKey } : null,
    })
  }

  async function onTestConnection() {
    if (!service.integration) return

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          integration: { ...service.integration, apiKey },
        }),
      })
      const body = (await response.json()) as { ok: boolean; text?: string; error?: string }

      if (body.ok) {
        setTestResult({ ok: true, message: body.text ?? 'Connected' })
      } else {
        setTestResult({ ok: false, message: body.error ?? 'Connection failed' })
      }
    } catch {
      setTestResult({ ok: false, message: 'Connection failed' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <label className="text-sm">
        Name
        <input
          className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>
      <label className="text-sm">
        URL
        <input
          className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          required
        />
      </label>
      <label className="text-sm">
        Logo URL
        <input
          className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2"
          value={logo}
          onChange={(event) => setLogo(event.target.value)}
          placeholder="Leave blank to use catalog logo"
        />
      </label>
      <label className="text-sm">
        Tags (comma-separated)
        <input
          className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />
      </label>
      {service.integration && (
        <>
          <label className="text-sm">
            {service.integration.kind} API key
            <input
              className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="API key"
            />
          </label>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="self-start rounded-lg border border-white/20 px-3 py-1.5 text-sm disabled:opacity-50"
              disabled={testing || !url}
              onClick={() => void onTestConnection()}
            >
              {testing ? 'Testing…' : 'Test connection'}
            </button>
            {testResult && (
              <p
                className={`text-sm ${testResult.ok ? 'text-emerald-300' : 'text-rose-300'}`}
                role="status"
              >
                {testResult.ok ? `Connected: ${testResult.message}` : testResult.message}
              </p>
            )}
          </div>
        </>
      )}
      <div className="mt-2 flex justify-between">
        <button type="button" className="text-sm text-rose-300" onClick={() => void onRemove()}>
          Remove
        </button>
        <button type="submit" className="rounded-lg bg-sky-400 px-4 py-2 text-sm text-black">
          Save
        </button>
      </div>
    </form>
  )
}
