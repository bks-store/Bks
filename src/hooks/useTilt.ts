import { useEffect, useState } from 'react'

interface Options {
  max?: number
  touch?: boolean
}

// Tilts the element in 3D towards the pointer (mouse), or follows a horizontal finger
// drag when `touch` is enabled. Writes --rx / --ry / --tilt-on CSS variables.
export function useTilt<T extends HTMLElement>({ max = 12, touch = false }: Options = {}) {
  const [el, setEl] = useState<T | null>(null)

  useEffect(() => {
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let target = { rx: 0, ry: 0 }
    let current = { rx: 0, ry: 0 }
    let dragStartX: number | null = null
    let dragStartY = 0
    let dragging = false

    const apply = () => {
      current.rx += (target.rx - current.rx) * 0.14
      current.ry += (target.ry - current.ry) * 0.14
      el.style.setProperty('--rx', `${current.rx.toFixed(2)}deg`)
      el.style.setProperty('--ry', `${current.ry.toFixed(2)}deg`)
      const done = Math.abs(target.rx - current.rx) < 0.05 && Math.abs(target.ry - current.ry) < 0.05
      frame = done ? 0 : requestAnimationFrame(apply)
    }
    const animate = () => { if (!frame) frame = requestAnimationFrame(apply) }

    const setFrom = (clientX: number, clientY: number) => {
      const r = el.getBoundingClientRect()
      const px = (clientX - r.left) / r.width - 0.5
      const py = (clientY - r.top) / r.height - 0.5
      target = { rx: -py * max, ry: px * max * 1.6 }
      animate()
    }
    const reset = () => {
      target = { rx: 0, ry: 0 }
      el.style.setProperty('--tilt-on', '0')
      animate()
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        el.style.setProperty('--tilt-on', '1')
        setFrom(e.clientX, e.clientY)
        return
      }
      if (!touch || dragStartX === null) return
      const dx = e.clientX - dragStartX
      if (!dragging && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - dragStartY)) dragging = true
      if (!dragging) return
      el.style.setProperty('--tilt-on', '1')
      const ry = Math.max(-1, Math.min(1, dx / (el.clientWidth * 0.5))) * max * 2.5
      target = { rx: 0, ry }
      animate()
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || !touch) return
      dragStartX = e.clientX
      dragStartY = e.clientY
      dragging = false
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return
      dragStartX = null
      dragging = false
      reset()
    }
    const onLeave = (e: PointerEvent) => { if (e.pointerType === 'mouse') reset() }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [el, max, touch])

  return setEl
}
