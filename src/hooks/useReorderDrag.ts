'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type DragPreviewState,
  previewOrder,
  shouldShowDropSlot,
} from '@/lib/landing/drag-preview'

export function useReorderDrag({
  zone,
  order,
  onCommit,
}: {
  zone: 'grid' | 'pinned'
  order: string[]
  onCommit: (id: string, beforeId: string | null) => void
}) {
  const [drag, setDrag] = useState<DragPreviewState | null>(null)
  const dragRef = useRef<DragPreviewState | null>(null)
  const didDropRef = useRef(false)

  useEffect(() => {
    dragRef.current = drag
  }, [drag])

  const setDragState = useCallback((next: DragPreviewState | null) => {
    dragRef.current = next
    setDrag(next)
  }, [])

  const begin = useCallback(
    (id: string) => {
      didDropRef.current = false
      setDragState({ zone, draggedId: id, overId: id })
    },
    [setDragState, zone],
  )

  const hover = useCallback(
    (id: string) => {
      const current = dragRef.current
      if (!current || current.zone !== zone) return
      if (current.overId === id) return
      setDragState({ ...current, overId: id })
    },
    [setDragState, zone],
  )

  const dropCommit = useCallback(() => {
    const current = dragRef.current
    if (!current?.overId || current.draggedId === current.overId) {
      setDragState(null)
      return
    }

    didDropRef.current = true
    onCommit(current.draggedId, current.overId)
    setDragState(null)
  }, [onCommit, setDragState])

  const end = useCallback(() => {
    if (!didDropRef.current) {
      setDragState(null)
    }
    didDropRef.current = false
  }, [setDragState])

  const displayOrder = previewOrder(order, drag, zone)

  const isDragging = useCallback(
    (id: string) => drag != null && drag.zone === zone && drag.draggedId === id,
    [drag, zone],
  )

  const isDropTarget = useCallback(
    (id: string) => shouldShowDropSlot(drag, zone, id),
    [drag, zone],
  )

  return {
    drag,
    displayOrder,
    begin,
    hover,
    dropCommit,
    end,
    isDragging,
    isDropTarget,
  }
}
