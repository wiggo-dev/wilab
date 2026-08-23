import { getConfigStore } from '@/lib/config/store'
import { getLiveGlances } from '@/lib/integrations/live'

export async function GET() {
  const config = await getConfigStore().load()
  const live = await getLiveGlances(config)
  return Response.json(live)
}
