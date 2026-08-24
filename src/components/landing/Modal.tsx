'use client'

import { useEffect, useRef, type ReactNode } from 'react'

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const pointerOnBackdrop = useRef(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
      onPointerDown={(event) => {
        pointerOnBackdrop.current = event.target === event.currentTarget
      }}
      onPointerUp={(event) => {
        if (pointerOnBackdrop.current && event.target === event.currentTarget) {
          onClose()
        }
        pointerOnBackdrop.current = false
      }}
    >
      <div
        className="max-h-[80vh] w-full max-w-md overflow-auto rounded-2xl bg-[#152038] p-5 ring-1 ring-white/15"
        onPointerDown={(event) => {
          pointerOnBackdrop.current = false
          event.stopPropagation()
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400" aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
