type Swatch = {
  idle: string
  active: string
}

const NAMED: Record<string, Swatch> = {
  home: {
    idle: 'bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/40',
    active: 'bg-amber-400 text-black ring-1 ring-amber-300',
  },
  infra: {
    idle: 'bg-sky-400/20 text-sky-200 ring-1 ring-sky-400/40',
    active: 'bg-sky-400 text-black ring-1 ring-sky-300',
  },
  media: {
    idle: 'bg-violet-400/20 text-violet-200 ring-1 ring-violet-400/40',
    active: 'bg-violet-400 text-black ring-1 ring-violet-300',
  },
  photos: {
    idle: 'bg-pink-400/20 text-pink-200 ring-1 ring-pink-400/40',
    active: 'bg-pink-400 text-black ring-1 ring-pink-300',
  },
  security: {
    idle: 'bg-rose-400/20 text-rose-200 ring-1 ring-rose-400/40',
    active: 'bg-rose-400 text-black ring-1 ring-rose-300',
  },
  finance: {
    idle: 'bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/40',
    active: 'bg-emerald-400 text-black ring-1 ring-emerald-300',
  },
}

const FALLBACK: Swatch[] = [
  {
    idle: 'bg-teal-400/20 text-teal-200 ring-1 ring-teal-400/40',
    active: 'bg-teal-400 text-black ring-1 ring-teal-300',
  },
  {
    idle: 'bg-orange-400/20 text-orange-200 ring-1 ring-orange-400/40',
    active: 'bg-orange-400 text-black ring-1 ring-orange-300',
  },
  {
    idle: 'bg-lime-400/20 text-lime-200 ring-1 ring-lime-400/40',
    active: 'bg-lime-400 text-black ring-1 ring-lime-300',
  },
  {
    idle: 'bg-cyan-400/20 text-cyan-200 ring-1 ring-cyan-400/40',
    active: 'bg-cyan-400 text-black ring-1 ring-cyan-300',
  },
  {
    idle: 'bg-fuchsia-400/20 text-fuchsia-200 ring-1 ring-fuchsia-400/40',
    active: 'bg-fuchsia-400 text-black ring-1 ring-fuchsia-300',
  },
  {
    idle: 'bg-indigo-400/20 text-indigo-200 ring-1 ring-indigo-400/40',
    active: 'bg-indigo-400 text-black ring-1 ring-indigo-300',
  },
]

export function tagClass(tag: string, active: boolean) {
  const named = NAMED[tag]
  if (named) return active ? named.active : named.idle
  let n = 0
  for (let i = 0; i < tag.length; i++) n = (n + tag.charCodeAt(i) * (i + 1)) % FALLBACK.length
  const swatch = FALLBACK[n] ?? FALLBACK[0]
  return active ? swatch.active : swatch.idle
}
