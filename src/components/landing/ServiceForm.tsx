'use client'

import { useState, type FormEvent } from 'react'
import { catalogUrlUsesHostTemplate, substituteHostInUrl } from '@/lib/catalog/host-template'
import type { DisplayService } from '@/lib/config/types'
import { parseTagsInput } from '@/lib/config/mutations'
import {
  isApiKeyIntegration,
  isHttpHealthIntegration,
  isQnapIntegration,
  type ServiceIntegration,
} from '@/lib/integrations/types'

function canUseHttpHealth(integration: DisplayService['integration']): boolean {
  return integration == null || isHttpHealthIntegration(integration)
}

export function ServiceForm({
  service,
  hostPresets = [],
  onSave,
  onRemove,
  removeLabel = 'Remove',
}: {
  service: DisplayService
  hostPresets?: string[]
  onSave: (
    patch: Pick<DisplayService, 'name' | 'url' | 'logo' | 'tags' | 'integration'>,
  ) => void | Promise<void>
  onRemove: () => void | Promise<void>
  removeLabel?: string
}) {
  const [name, setName] = useState(service.name)
  const [url, setUrl] = useState(service.url)
  const [logo, setLogo] = useState(service.logo)
  const [tags, setTags] = useState(service.tags.join(', '))
  const [apiKey, setApiKey] = useState(
    service.integration && isApiKeyIntegration(service.integration)
      ? service.integration.apiKey
      : '',
  )
  const [username, setUsername] = useState(
    service.integration && isQnapIntegration(service.integration) ? service.integration.username : '',
  )
  const [password, setPassword] = useState(
    service.integration && isQnapIntegration(service.integration) ? service.integration.password : '',
  )
  const [httpHealthEnabled, setHttpHealthEnabled] = useState(
    service.integration != null && isHttpHealthIntegration(service.integration),
  )
  const [healthPath, setHealthPath] = useState(
    service.integration && isHttpHealthIntegration(service.integration)
      ? service.integration.path
      : '',
  )
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  function buildIntegration(): ServiceIntegration | null {
    if (canUseHttpHealth(service.integration)) {
      if (!httpHealthEnabled) return null
      return { kind: 'http-health', path: healthPath.trim() }
    }
    if (!service.integration) return null
    if (isQnapIntegration(service.integration)) {
      return { kind: 'qnap', username, password }
    }
    return { ...service.integration, apiKey }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    await onSave({
      name,
      url,
      logo,
      tags: parseTagsInput(tags),
      integration: buildIntegration(),
    })
  }

  async function onTestConnection() {
    const integration = buildIntegration()
    if (!integration) return

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, integration }),
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

  const showHttpHealth = canUseHttpHealth(service.integration)
  const hasTestableIntegration =
    (showHttpHealth && httpHealthEnabled) ||
    (service.integration != null && !showHttpHealth)

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
      {catalogUrlUsesHostTemplate(url) && hostPresets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span>Use preset:</span>
          {hostPresets.map((host) => (
            <button
              key={host}
              type="button"
              className="rounded-full bg-white/10 px-2.5 py-1 hover:bg-white/20"
              onClick={() => setUrl(substituteHostInUrl(url, host))}
            >
              {host}
            </button>
          ))}
        </div>
      )}
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
      {showHttpHealth && (
        <>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={httpHealthEnabled}
              onChange={(event) => {
                setHttpHealthEnabled(event.target.checked)
                setTestResult(null)
              }}
            />
            HTTP health check
          </label>
          {httpHealthEnabled && (
            <>
              <label className="text-sm">
                Health path (optional)
                <input
                  className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2"
                  value={healthPath}
                  onChange={(event) => setHealthPath(event.target.value)}
                  placeholder="Leave blank to use the service URL"
                />
              </label>
              <p className="text-xs text-white/50">
                Polls the service URL (or this path on the same host) and shows Up or the HTTP
                status on the tile.
              </p>
            </>
          )}
        </>
      )}
      {service.integration && isQnapIntegration(service.integration) && (
        <>
          <label className="text-sm">
            QNAP username
            <input
              className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="text-sm">
            QNAP password
            <input
              type="password"
              className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          <p className="text-xs text-white/50">
            Use a local QTS account without 2-step verification. Password is stored in your wilab
            config.
          </p>
        </>
      )}
      {service.integration && isApiKeyIntegration(service.integration) && (
        <label className="text-sm">
          {service.integration.kind} API key
          <input
            className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="API key"
          />
        </label>
      )}
      {hasTestableIntegration && (
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
      )}
      <div className="mt-2 flex justify-between">
        <button type="button" className="text-sm text-rose-300" onClick={() => void onRemove()}>
          {removeLabel}
        </button>
        <button type="submit" className="rounded-lg bg-sky-400 px-4 py-2 text-sm text-black">
          Save
        </button>
      </div>
    </form>
  )
}
