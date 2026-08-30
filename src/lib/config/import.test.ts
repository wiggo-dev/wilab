import { describe, expect, it } from 'vitest'
import { createDefaultConfig } from './defaults'
import { configExportJson, parseConfigImport, summarizeConfigImport } from './import'
import { SCHEMA_VERSION } from './types'

describe('parseConfigImport', () => {
  it('accepts valid schema v1 JSON and returns a normalized config', () => {
    const source = createDefaultConfig()
    source.services = [
      {
        id: 'svc-a',
        catalogId: null,
        name: 'A',
        url: 'http://a',
        logo: '',
        tags: [],
        integration: null,
      },
    ]
    source.gridOrder = ['svc-a', 'orphan']
    source.pinnedOrder = ['svc-a']

    const result = parseConfigImport(JSON.stringify(source))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.config.schemaVersion).toBe(SCHEMA_VERSION)
    expect(result.config.services).toHaveLength(1)
    expect(result.config.gridOrder).toEqual(['svc-a'])
    expect(result.config.pinnedOrder).toEqual(['svc-a'])
    expect(result.config.hostPresets).toEqual([])
  })

  it('rejects non-JSON', () => {
    const result = parseConfigImport('{not-json')
    expect(result).toEqual({
      ok: false,
      error: 'Invalid JSON — could not parse the file.',
    })
  })

  it('rejects a non-object payload', () => {
    expect(parseConfigImport('[]')).toEqual({
      ok: false,
      error: 'Config must be a JSON object.',
    })
    expect(parseConfigImport('null')).toEqual({
      ok: false,
      error: 'Config must be a JSON object.',
    })
  })

  it('rejects missing or unsupported schemaVersion', () => {
    expect(parseConfigImport(JSON.stringify({ services: [] }))).toEqual({
      ok: false,
      error: `Unsupported schema version: missing (expected ${SCHEMA_VERSION}).`,
    })
    expect(parseConfigImport(JSON.stringify({ schemaVersion: 99, services: [] }))).toEqual({
      ok: false,
      error: `Unsupported schema version: 99 (expected ${SCHEMA_VERSION}).`,
    })
  })
})

describe('summarizeConfigImport', () => {
  it('counts services, pins, and search providers', () => {
    const config = createDefaultConfig()
    config.services = [
      {
        id: 'a',
        catalogId: null,
        name: 'A',
        url: 'http://a',
        logo: '',
        tags: [],
        integration: null,
      },
      {
        id: 'b',
        catalogId: null,
        name: 'B',
        url: 'http://b',
        logo: '',
        tags: [],
        integration: null,
      },
    ]
    config.gridOrder = ['a', 'b']
    config.pinnedOrder = ['a']

    expect(summarizeConfigImport(config)).toEqual({
      serviceCount: 2,
      pinnedCount: 1,
      searchProviderCount: config.searchProviders.length,
    })
  })
})

describe('configExportJson', () => {
  it('pretty-prints the config with a trailing newline', () => {
    const config = createDefaultConfig()
    const exported = configExportJson(config)
    expect(exported.endsWith('\n')).toBe(true)
    expect(JSON.parse(exported)).toEqual(config)
    expect(exported).toContain('\n  "schemaVersion": 1')
  })
})
