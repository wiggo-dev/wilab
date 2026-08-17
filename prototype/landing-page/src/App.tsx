import { useEffect, useState } from 'react'
import { PrototypeSwitcher, VARIANTS, isVariantKey, type VariantKey } from './PrototypeSwitcher'
import { snapshot, useLandingState } from './useLandingState'
import { VariantA } from './variants/VariantA'
import { VariantB } from './variants/VariantB'
import { VariantC } from './variants/VariantC'

// PROTOTYPE — throwaway. Three variants of the wilab landing page, switchable via ?variant=, answering: what should the landing page look and feel like?

function readVariant(): VariantKey {
  const value = new URLSearchParams(window.location.search).get('variant') ?? 'A'
  return isVariantKey(value) ? value : 'A'
}

export default function App() {
  const api = useLandingState()
  const [variant, setVariant] = useState<VariantKey>(readVariant)

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('variant', variant)
    url.searchParams.delete('tags')
    window.history.replaceState(null, '', url)
    document.title = `wilab prototype — ${VARIANTS.find((v) => v.key === variant)?.name}`
  }, [variant])

  return (
    <>
      {variant === 'A' && <VariantA api={api} />}
      {variant === 'B' && <VariantB api={api} />}
      {variant === 'C' && <VariantC api={api} />}
      {import.meta.env.DEV && (
        <PrototypeSwitcher current={variant} onChange={setVariant} stateDump={snapshot(api.state)} />
      )}
    </>
  )
}
