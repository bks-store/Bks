import { useEffect, useRef } from 'react'

// Barre de Noël — slim, dans les couleurs de la marque
export function ChristmasBar() {
  return (
    <div style={{
      background: 'var(--bks-brun-profond)',
      color: 'var(--bks-creme)',
      textAlign: 'center',
      padding: '0.55rem 1rem',
      fontSize: '0.75rem',
      fontFamily: 'var(--ff-body)',
      fontWeight: 500,
      letterSpacing: '0.08em',
      lineHeight: 1,
    }}>
      <span style={{ opacity: 0.7, marginRight: '0.6rem' }}>❄</span>
      Livraison garantie avant Noël — commandez avant le&nbsp;20&nbsp;décembre
      <span style={{ opacity: 0.7, marginLeft: '0.6rem' }}>❄</span>
    </div>
  )
}

// Neige subtile — particules CSS pures, très discrètes
export function SnowOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = window.innerWidth
    let h = window.innerHeight
    canvas.width = w
    canvas.height = h

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w
      canvas.height = h
    }
    window.addEventListener('resize', resize)

    // 28 flocons très discrets
    const flakes = Array.from({ length: 28 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.6,     // 0.6–2.4px
      speed: Math.random() * 0.4 + 0.15, // lent
      drift: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.35 + 0.1, // 0.1–0.45
    }))

    let raf: number
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const f of flakes) {
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${f.opacity})`
        ctx.fill()
        f.y += f.speed
        f.x += f.drift
        if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w }
        if (f.x > w + 4) f.x = -4
        if (f.x < -4) f.x = w + 4
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 1,
      }}
      aria-hidden="true"
    />
  )
}
