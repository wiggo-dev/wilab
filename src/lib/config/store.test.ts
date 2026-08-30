import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_SEARCH_PROVIDERS } from './defaults'
import { ConfigStore, resolveDataDir } from './store'

describe('ConfigStore', () => {
  let dataDir: string
  let store: ConfigStore

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'wilab-config-'))
    store = new ConfigStore(dataDir)
  })

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true })
  })

  it('creates config on first load with schema v1 and seeded search providers', async () => {
    const config = await store.load()

    expect(config.schemaVersion).toBe(1)
    expect(config.services).toEqual([])
    expect(config.gridOrder).toEqual([])
    expect(config.pinnedOrder).toEqual([])
    expect(config.activeSearchProviderId).toBe('ddg')
    expect(config.searchProviders).toEqual(DEFAULT_SEARCH_PROVIDERS)
    expect(config.hostPresets).toEqual([])

    const onDisk = JSON.parse(await readFile(join(dataDir, 'config.json'), 'utf8'))
    expect(onDisk.schemaVersion).toBe(1)
    expect(onDisk.searchProviders).toHaveLength(4)
  })

  it('persists updates via atomic write-rename', async () => {
    const config = await store.load()
    config.services = [
      {
        id: 'svc-1',
        catalogId: null,
        name: 'One',
        url: 'http://one',
        logo: '',
        tags: [],
        integration: null,
      },
    ]
    config.gridOrder = ['svc-1']

    await store.save(config)

    const reloaded = await store.load()
    expect(reloaded.gridOrder).toEqual(['svc-1'])
    expect(await readFile(join(dataDir, 'config.json.tmp'), 'utf8').catch(() => null)).toBeNull()
  })

  it('ignores leftover tmp when config.json exists', async () => {
    await store.load()
    await writeFile(
      join(dataDir, 'config.json.tmp'),
      JSON.stringify({ schemaVersion: 99, services: [], gridOrder: ['stale'], pinnedOrder: [], searchProviders: [], activeSearchProviderId: 'ddg' }),
      'utf8',
    )

    const config = await store.load()
    expect(config.gridOrder).toEqual([])
    expect(config.schemaVersion).toBe(1)
  })

  it('promotes tmp when config.json is missing', async () => {
    const promoted = {
      schemaVersion: 1,
      services: [],
      gridOrder: ['from-tmp'],
      pinnedOrder: [],
      searchProviders: DEFAULT_SEARCH_PROVIDERS,
      activeSearchProviderId: 'ddg',
    }
    await writeFile(join(dataDir, 'config.json.tmp'), JSON.stringify(promoted), 'utf8')

    const config = await store.load()
    expect(config.gridOrder).toEqual([])
    expect(JSON.parse(await readFile(join(dataDir, 'config.json'), 'utf8')).gridOrder).toEqual([])
  })

  it('heals orphan gridOrder ids on load and rewrites disk', async () => {
    await writeFile(
      join(dataDir, 'config.json'),
      JSON.stringify({
        schemaVersion: 1,
        services: [
          {
            id: 'svc-1',
            catalogId: null,
            name: 'One',
            url: 'http://one',
            logo: '',
            tags: [],
            integration: null,
          },
        ],
        gridOrder: ['svc-1', 'ghost'],
        pinnedOrder: ['ghost'],
        searchProviders: DEFAULT_SEARCH_PROVIDERS,
        activeSearchProviderId: 'ddg',
      }),
      'utf8',
    )

    const config = await store.load()
    expect(config.gridOrder).toEqual(['svc-1'])
    expect(config.pinnedOrder).toEqual([])
    expect(config.hostPresets).toEqual([])

    const onDisk = JSON.parse(await readFile(join(dataDir, 'config.json'), 'utf8'))
    expect(onDisk.gridOrder).toEqual(['svc-1'])
    expect(onDisk.pinnedOrder).toEqual([])
  })
})

describe('resolveDataDir', () => {
  const previousDataDir = process.env.WILAB_DATA_DIR

  afterEach(() => {
    if (previousDataDir === undefined) {
      delete process.env.WILAB_DATA_DIR
    } else {
      process.env.WILAB_DATA_DIR = previousDataDir
    }
  })

  it('uses WILAB_DATA_DIR when set', () => {
    process.env.WILAB_DATA_DIR = '/custom/data'
    expect(resolveDataDir()).toBe('/custom/data')
  })

  it('defaults to ./data under cwd for local dev', () => {
    delete process.env.WILAB_DATA_DIR
    expect(resolveDataDir()).toBe(join(process.cwd(), 'data'))
  })
})
