import { closeSync, fsyncSync, openSync, renameSync } from 'node:fs'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createDefaultConfig } from './defaults'
import type { WilabConfig } from './types'
import { SCHEMA_VERSION } from './types'

export class ConfigStore {
  constructor(private readonly dataDir: string) {}

  private configPath(): string {
    return join(this.dataDir, 'config.json')
  }

  private tmpPath(): string {
    return join(this.dataDir, 'config.json.tmp')
  }

  async load(): Promise<WilabConfig> {
    await mkdir(this.dataDir, { recursive: true })
    await this.recoverFromTmpIfNeeded()

    try {
      const raw = await readFile(this.configPath(), 'utf8')
      const config = JSON.parse(raw) as WilabConfig
      this.assertSchemaVersion(config)
      return config
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        const config = createDefaultConfig()
        await this.save(config)
        return config
      }
      throw error
    }
  }

  async save(config: WilabConfig): Promise<void> {
    this.assertSchemaVersion(config)
    await mkdir(this.dataDir, { recursive: true })

    const payload = `${JSON.stringify(config, null, 2)}\n`
    const tmpPath = this.tmpPath()
    await writeFile(tmpPath, payload, 'utf8')

    const fd = openSync(tmpPath, 'r+')
    try {
      fsyncSync(fd)
    } finally {
      closeSync(fd)
    }

    renameSync(tmpPath, this.configPath())
  }

  private async recoverFromTmpIfNeeded(): Promise<void> {
    const configPath = this.configPath()
    const tmpPath = this.tmpPath()

    try {
      await readFile(configPath, 'utf8')
      return
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }

    try {
      await readFile(tmpPath, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return
      }
      throw error
    }

    await rename(tmpPath, configPath)
  }

  private assertSchemaVersion(config: WilabConfig): void {
    if (config.schemaVersion !== SCHEMA_VERSION) {
      throw new Error(`Unsupported schema version: ${config.schemaVersion}`)
    }
  }
}

export function resolveDataDir(): string {
  if (process.env.WILAB_DATA_DIR) {
    return process.env.WILAB_DATA_DIR
  }
  return join(process.cwd(), 'data')
}

export function getConfigStore(): ConfigStore {
  return new ConfigStore(resolveDataDir())
}
