import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getCatalogEntryById } from '@/lib/catalog/catalog'
import {
  addServiceFromCatalog,
  createCustomService,
  removeService,
  togglePin,
  updateService,
} from '@/lib/config/mutations'
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
    const updated = {
      ...initial,
      services: [
        {
          id: 'service-a',
          catalogId: null,
          name: 'Service A',
          url: 'http://a',
          logo: '',
          tags: [],
          integration: null,
        },
      ],
      gridOrder: ['service-a'],
    }

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

  it('PUT rejects unsupported schemaVersion', async () => {
    const { PUT } = await import('./route')

    await expect(
      PUT(
        new Request('http://localhost/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schemaVersion: 99,
            services: [],
            gridOrder: [],
            pinnedOrder: [],
            searchProviders: DEFAULT_SEARCH_PROVIDERS,
            activeSearchProviderId: 'ddg',
          }),
        }),
      ),
    ).rejects.toThrow(/Unsupported schema version/)
  })

  it('persists service add, update, pin, and remove mutations', async () => {
    const { GET, PUT } = await import('./route')
    const initial = await (await GET()).json()
    const sonarr = getCatalogEntryById('sonarr')
    expect(sonarr).not.toBeNull()

    let next = addServiceFromCatalog(initial, sonarr!, 'svc-sonarr').config
    next = updateService(next, 'svc-sonarr', {
      url: 'http://sonarr.lab.lan:8989',
      tags: ['media'],
    })
    next = togglePin(next, 'svc-sonarr')

    const custom = createCustomService({
      id: 'svc-router',
      name: 'Router',
      url: 'http://192.168.1.1',
      logo: '',
      tags: ['infra'],
    })
    next = {
      ...next,
      services: [...next.services, custom],
      gridOrder: [...next.gridOrder, custom.id],
    }

    await PUT(
      new Request('http://localhost/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }),
    )

    let reloaded = await (await GET()).json()
    expect(reloaded.services).toHaveLength(2)
    expect(reloaded.pinnedOrder).toEqual(['svc-sonarr'])
    expect(reloaded.gridOrder).toEqual(['svc-sonarr', 'svc-router'])

    reloaded = removeService(reloaded, 'svc-router')
    await PUT(
      new Request('http://localhost/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reloaded),
      }),
    )

    const finalConfig = await (await GET()).json()
    expect(finalConfig.services).toHaveLength(1)
    expect(finalConfig.gridOrder).toEqual(['svc-sonarr'])
  })
})
