import { describe, expect, it } from 'vitest'
import {
  catalogUrlUsesHostTemplate,
  substituteHostInUrl,
} from './host-template'

describe('host-template', () => {
  it('detects {host} in catalog URLs', () => {
    expect(catalogUrlUsesHostTemplate('http://{host}:8989')).toBe(true)
    expect(catalogUrlUsesHostTemplate('http://nas.local:8989')).toBe(false)
  })

  it('substitutes host into template URLs', () => {
    expect(substituteHostInUrl('http://{host}:8989', 'nas.local')).toBe('http://nas.local:8989')
    expect(substituteHostInUrl('https://{host}', ' 192.168.1.10 ')).toBe('https://192.168.1.10')
  })
})
