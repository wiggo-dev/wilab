import { describe, expect, it } from 'vitest'
import { FIXTURE_CONFIG } from './fixtures'
import { resolveConfigForDisplay, resolveServiceLogo } from './resolve-services'

describe('resolve-services', () => {
  it('fills bundled catalog logos when a service logo is empty', () => {
    expect(resolveServiceLogo(FIXTURE_CONFIG.services[0])).toBe('/catalog/icons/home-assistant.svg')
    expect(resolveServiceLogo(FIXTURE_CONFIG.services[4])).toBe('')
  })

  it('resolves all services for display', () => {
    const resolved = resolveConfigForDisplay(FIXTURE_CONFIG)
    expect(resolved.services[2].logo).toBe('/catalog/icons/sonarr.svg')
  })
})
