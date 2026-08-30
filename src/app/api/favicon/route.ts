import { resolveFavicon } from '@/lib/favicon/resolve-favicon'

type FaviconRequestBody = {
  url?: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as FaviconRequestBody

  if (!body.url) {
    return Response.json({ ok: false, error: 'Missing url' }, { status: 400 })
  }

  const result = await resolveFavicon(body.url)
  return Response.json(result)
}
