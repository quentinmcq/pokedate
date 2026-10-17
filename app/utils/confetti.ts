export function launchConfetti(colors: string[]) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const c = document.getElementById('confetti') as HTMLCanvasElement | null
  const ctx = c?.getContext('2d')
  if (!c || !ctx) return
  const dpr = devicePixelRatio || 1
  c.width = innerWidth * dpr
  c.height = innerHeight * dpr
  ctx.scale(dpr, dpr)
  const parts = Array.from({ length: 160 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 200,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 14 - 4,
    r: Math.random() * 6 + 4,
    rot: Math.random() * 6,
    vr: (Math.random() - 0.5) * 0.3,
    c: colors[Math.floor(Math.random() * colors.length)]!,
  }))
  const t0 = performance.now()
  const frame = (t: number) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight)
    for (const p of parts) {
      p.vy += 0.35
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.c
      ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2)
      ctx.restore()
    }
    if (t - t0 < 3000) requestAnimationFrame(frame)
    else ctx.clearRect(0, 0, innerWidth, innerHeight)
  }
  requestAnimationFrame(frame)
}
