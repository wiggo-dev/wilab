import { getConfigStore } from '@/lib/config/store'
import type { WilabConfig } from '@/lib/config/types'

export async function GET() {
  const config = await getConfigStore().load()
  return Response.json(config)
}

export async function PUT(request: Request) {
  const body = (await request.json()) as WilabConfig
  const saved = await getConfigStore().save(body)
  return Response.json(saved)
}
