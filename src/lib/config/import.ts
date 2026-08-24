import { normalizeWilabConfig } from './normalize'
import type { WilabConfig } from './types'
import { SCHEMA_VERSION } from './types'

export type ConfigImportResult =
  | { ok: true; config: WilabConfig }
  | { ok: false; error: string }

export type ConfigImportSummary = {
  serviceCount: number
  pinnedCount: number
  searchProviderCount: number
}

export function parseConfigImport(raw: string): ConfigImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    return { ok: false, error: 'Invalid JSON — could not parse the file.' }
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Config must be a JSON object.' }
  }

  const record = parsed as Record<string, unknown>
  if (!('schemaVersion' in record) || record.schemaVersion === undefined || record.schemaVersion === null) {
    return {
      ok: false,
      error: `Unsupported schema version: missing (expected ${SCHEMA_VERSION}).`,
    }
  }

  if (record.schemaVersion !== SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Unsupported schema version: ${String(record.schemaVersion)} (expected ${SCHEMA_VERSION}).`,
    }
  }

  return { ok: true, config: normalizeWilabConfig(record as WilabConfig) }
}

export function summarizeConfigImport(config: WilabConfig): ConfigImportSummary {
  return {
    serviceCount: config.services.length,
    pinnedCount: config.pinnedOrder.length,
    searchProviderCount: config.searchProviders.length,
  }
}

export function configExportJson(config: WilabConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`
}
