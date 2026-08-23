import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SEARCH_PROVIDERS } from '@/lib/config/defaults'

describe('/api/config', () => {
  let dataDir: string
  const previousDataDir = process.env.WILAB_DATA_DIR

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'wilab-api-config-'))
    process.env.WILAB_DATA_DIR = dataDir
    vi.resetModules()
  })

  afterEach(async () => {
    if (previousDataDir === undefined) {
      delete process.env.WILAB_DATA_DIR
    } else {
      process.env.WILAB_DATA_DIR = previousDataDir
    }
    await rm(dataDir, { recursive: true, force: true })
    vi.resetModules()
  })

  it('GET returns seeded config on first run', async () => {
    const { GET } = await import('./route')
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.schemaVersion).toBe(1)
    expect(body.services).toEqual([])
    expect(body.searchProviders).toEqual(DEFAULT_SEARCH_PROVIDERS)
  })

  it('PUT persists config changes', async () => {
    const { GET, PUT } = await import('./route')

    const initial = await (await GET()).json()
    const updated = { ...initial, gridOrder: ['service-a'] }

    const putResponse = await PUT(
      new Request('http://localhost/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }),
    )

    expect(putResponse.status).toBe(200)

    const reloaded = await (await GET()).json()
    expect(reloaded.gridOrder).toEqual(['service-a'])
  })
})
