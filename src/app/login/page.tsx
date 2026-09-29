'use client'

import { type FormEvent, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        setError(body?.error ?? 'Could not sign in')
        return
      }
      const next = searchParams.get('next')
      router.replace(next && next.startsWith('/') ? next : '/')
      router.refresh()
    } catch {
      setError('Could not sign in')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mt-8 space-y-4">
      <label className="block text-sm text-slate-300">
        Access token
        <input
          type="password"
          autoComplete="current-password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          className="mt-1.5 w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/15 focus:ring-sky-400/60"
          required
        />
      </label>
      {error && (
        <p className="text-sm text-rose-300" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-sky-400 px-3 py-2 text-sm font-medium text-black hover:bg-sky-300 disabled:opacity-60"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#0b1220] px-6 text-slate-100">
      <div className="w-full max-w-sm">
        <p className="text-sm tracking-[0.3em] text-sky-300/80 uppercase">wilab</p>
        <h1 className="mt-3 text-2xl font-medium text-white">Sign in</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter the shared access token configured as <code className="text-slate-300">WILAB_ACCESS_TOKEN</code>.
        </p>
        <Suspense fallback={<p className="mt-8 text-sm text-slate-400">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
