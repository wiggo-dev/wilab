import { getCatalog } from '@/lib/catalog/catalog'
import { getConfigStore } from '@/lib/config/store'
import { resolveConfigForDisplay } from '@/lib/landing/resolve-services'
import { LandingPage } from '@/components/landing/LandingPage'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const config = resolveConfigForDisplay(await getConfigStore().load())
  const catalog = getCatalog()
  return <LandingPage config={config} catalog={catalog} />
}
