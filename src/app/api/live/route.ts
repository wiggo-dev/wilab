import { getConfigStore } from '@/lib/config/store'
import { getGlanceEngine } from '@/lib/integrations/live'

export async function GET() {
  const config = await getConfigStore().load()
  const live = await getGlanceEngine().get(config)
  return Response.json(live)
}
