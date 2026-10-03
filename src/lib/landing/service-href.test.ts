import { describe, expect, it } from 'vitest'
import { serviceHref } from './service-href'

describe('serviceHref', () => {
  it('uses the service url when openUrl is unset', () => {
    expect(serviceHref({ url: 'http://sonarr.lab:8989', openUrl: null })).toBe(
      'http://sonarr.lab:8989',
    )
  })

  it('uses a trimmed openUrl when set', () => {
    expect(
      serviceHref({
        url: 'http://192.168.1.50:8989',
        openUrl: '  https://sonarr.ts.net  ',
      }),
    ).toBe('https://sonarr.ts.net')
  })

  it('falls back to url when openUrl is blank', () => {
    expect(serviceHref({ url: 'http://plex.lab', openUrl: '   ' })).toBe('http://plex.lab')
  })
})
