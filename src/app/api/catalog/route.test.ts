import { describe, expect, it } from 'vitest'
import { GET as listCatalog } from './route'
import { GET as getCatalogEntry } from './[id]/route'

describe('/api/catalog', () => {
  it('GET returns all catalog entries', async () => {
    const response = await listCatalog()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toHaveLength(20)
    expect(body[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      defaultUrl: expect.any(String),
      logo: expect.stringMatching(/^\/catalog\/icons\/.+\.svg$/),
      integration: expect.anything(),
    })
  })
})

describe('/api/catalog/[id]', () => {
  it('GET returns a catalog entry by id', async () => {
    const response = await getCatalogEntry(new Request('http://localhost/api/catalog/radarr'), {
      params: Promise.resolve({ id: 'radarr' }),
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      id: 'radarr',
      name: 'Radarr',
      defaultUrl: 'http://{host}:7878',
      logo: '/catalog/icons/radarr.svg',
      integration: 'radarr',
    })
  })

  it('GET returns 404 for unknown ids', async () => {
    const response = await getCatalogEntry(new Request('http://localhost/api/catalog/nope'), {
      params: Promise.resolve({ id: 'nope' }),
    })

    expect(response.status).toBe(404)
  })
})
