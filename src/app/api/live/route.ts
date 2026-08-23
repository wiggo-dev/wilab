import { getConfigStore } from '@/lib/config/store'
import { getLiveGlances } from '@/lib/integrations/live'
import { upstreamFetch } from '@/lib/integrations/upstream-fetch'

export async function GET() {
  const config = await getConfigStore().load()
  const live = await getLiveGlances(config, upstreamFetch)
  return Response.json(live)
}
