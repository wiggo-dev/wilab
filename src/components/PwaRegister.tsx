'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Installability still works via the web manifest without a SW in some browsers;
      // registration failures are non-fatal for the landing page itself.
    })
  }, [])

  return null
}
