import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getJson, trimBase } from './upstream-request'

describe('trimBase', () => {
  it('strips a trailing slash and leaves other URLs alone', () => {
    expect(trimBase('http://sonarr.lab:8989/')).toBe('http://sonarr.lab:8989')
    expect(trimBase('http://sonarr.lab:8989')).toBe('http://sonarr.lab:8989')
    expect(trimBase('https://portainer.lab:9443/path/')).toBe('https://portainer.lab:9443/path')
  })
})

describe('getJson', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('returns parsed JSON for a 2xx response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ totalCount: 3 }),
    })

    await expect(
      getJson<{ totalCount: number }>('http://sonarr.lab/api', {
        headers: { 'X-Api-Key': 'secret' },
        fetch: fetchMock,
        label: 'Arr queue status',
      }),
    ).resolves.toEqual({ totalCount: 3 })

    expect(fetchMock).toHaveBeenCalledWith('http://sonarr.lab/api', {
      headers: { 'X-Api-Key': 'secret' },
    })
  })

  it('throws a labeled HTTP error for non-ok responses', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    })

    await expect(
      getJson('http://ha.lab/api/states', {
        headers: { Authorization: 'Bearer token' },
        fetch: fetchMock,
        label: 'Home Assistant states',
      }),
    ).rejects.toThrow('Home Assistant states failed: 401')
  })
})
