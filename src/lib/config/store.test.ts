import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_SEARCH_PROVIDERS } from './defaults'
import { ConfigStore } from './store'

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

    const onDisk = JSON.parse(await readFile(join(dataDir, 'config.json'), 'utf8'))
    expect(onDisk.schemaVersion).toBe(1)
    expect(onDisk.searchProviders).toHaveLength(4)
  })

  it('persists updates via atomic write-rename', async () => {
    const config = await store.load()
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
    expect(config.gridOrder).toEqual(['from-tmp'])
    expect(await readFile(join(dataDir, 'config.json'), 'utf8')).toBe(JSON.stringify(promoted))
  })
})
