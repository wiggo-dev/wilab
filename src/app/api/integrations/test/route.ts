import { testIntegrationConnection } from '@/lib/integrations/test-connection'
import type { ServiceIntegration } from '@/lib/integrations/types'

type TestRequestBody = {
  url?: string
  integration?: ServiceIntegration
}

export async function POST(request: Request) {
  const body = (await request.json()) as TestRequestBody

  if (!body.url || !body.integration) {
    return Response.json({ ok: false, error: 'Missing url or integration' }, { status: 400 })
  }

  const result = await testIntegrationConnection(body.url, body.integration)
  return Response.json(result)
}
