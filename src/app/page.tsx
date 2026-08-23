import { getConfigStore } from '@/lib/config/store'
import { resolveConfigForDisplay } from '@/lib/landing/resolve-services'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function Home() {
  const config = resolveConfigForDisplay(await getConfigStore().load())
  return <LandingPage config={config} />
}
