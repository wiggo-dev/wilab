import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  authLoginUrl,
  encodeQnapPassword,
  fetchQnapGlance,
  formatQnapGlance,
  parseCpuUsage,
  parseMemoryUsagePercent,
  readXmlTag,
  resetQnapSessionCache,
  sysinfoUrl,
} from './qnap'

const LOGIN_OK = `<?xml version="1.0" encoding="UTF-8"?>
<QDocRoot version="1.0">
  <authPassed>1</authPassed>
  <authSid>abc123sid</authSid>
</QDocRoot>`

const SYSINFO_OK = `<?xml version="1.0" encoding="UTF-8"?>
<QDocRoot version="1.0">
  <func><ownContent><root>
    <cpu_usage>17%</cpu_usage>
    <total_memory>16384</total_memory>
    <free_memory>8192</free_memory>
  </root></ownContent></func>
</QDocRoot>`

describe('qnap integration', () => {
  it('builds auth and sysinfo urls', () => {
    expect(authLoginUrl('http://nas.lab:8080')).toBe('http://nas.lab:8080/cgi-bin/authLogin.cgi')
    expect(sysinfoUrl('http://nas.lab:8080', 'sid1')).toContain(
      'http://nas.lab:8080/cgi-bin/management/manaRequest.cgi?',
    )
    expect(sysinfoUrl('http://nas.lab:8080', 'sid1')).toContain('sid=sid1')
  })

  it('base64-encodes passwords for QTS login', () => {
    expect(encodeQnapPassword('secret')).toBe(Buffer.from('secret', 'utf8').toString('base64'))
  })

  it('parses cpu and memory from sysinfo xml', () => {
    expect(readXmlTag(SYSINFO_OK, 'cpu_usage')).toBe('17%')
    expect(parseCpuUsage('17%')).toBe(17)
    expect(parseMemoryUsagePercent('16384', '8192')).toBe(50)
    expect(formatQnapGlance(17, 50)).toBe('17% CPU · 50% RAM')
    expect(formatQnapGlance(null, null)).toBe('—% CPU · —% RAM')
  })

  describe('fetchQnapGlance', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      fetchMock.mockReset()
      resetQnapSessionCache()
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
      resetQnapSessionCache()
    })

    it('logs in then fetches sysinfo with session id', async () => {
      fetchMock
        .mockResolvedValueOnce({ ok: true, text: async () => LOGIN_OK })
        .mockResolvedValueOnce({ ok: true, text: async () => SYSINFO_OK })

      const text = await fetchQnapGlance('http://nas.lab:8080', 'admin', 'secret')

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'http://nas.lab:8080/cgi-bin/authLogin.cgi',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(URLSearchParams),
        }),
      )
      expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringContaining('sid=abc123sid'))
      expect(text).toBe('17% CPU · 50% RAM')
    })

    it('reuses cached sid within the live coalesce window', async () => {
      fetchMock
        .mockResolvedValueOnce({ ok: true, text: async () => LOGIN_OK })
        .mockResolvedValueOnce({ ok: true, text: async () => SYSINFO_OK })
        .mockResolvedValueOnce({ ok: true, text: async () => SYSINFO_OK })

      await fetchQnapGlance('http://nas.lab:8080', 'admin', 'secret')
      await fetchQnapGlance('http://nas.lab:8080', 'admin', 'secret')

      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(fetchMock.mock.calls.filter((call) => call[0].includes('authLogin'))).toHaveLength(1)
    })
  })
})
