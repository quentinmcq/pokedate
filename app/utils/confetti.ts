const PARTICLE_COUNT = 160
const ANIMATION_DURATION_MS = 3000
const GRAVITY = 0.35
const AIR_RESISTANCE = 0.99

interface ConfettiParticle {
  endTime: number
  x: number
  y: number
  velocityX: number
  velocityY: number
  size: number
  rotation: number
  rotationSpeed: number
  color: string
}

function createParticle(colors: string[], endTime: number): ConfettiParticle {
  return {
    endTime,
    x: innerWidth / 2 + (Math.random() - 0.5) * 200,
    y: innerHeight * 0.35,
    velocityX: (Math.random() - 0.5) * 14,
    velocityY: -Math.random() * 14 - 4,
    size: Math.random() * 6 + 4,
    rotation: Math.random() * 6,
    rotationSpeed: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)] ?? '#ffffff',
  }
}

function drawParticle(context: CanvasRenderingContext2D, particle: ConfettiParticle) {
  context.save()
  context.translate(particle.x, particle.y)
  context.rotate(particle.rotation)
  context.fillStyle = particle.color
  context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2)
  context.restore()
}

function moveParticle(particle: ConfettiParticle) {
  particle.velocityY += GRAVITY
  particle.velocityX *= AIR_RESISTANCE
  particle.x += particle.velocityX
  particle.y += particle.velocityY
  particle.rotation += particle.rotationSpeed
}

let particles: ConfettiParticle[] = []
let isAnimating = false

// Clears the whole bitmap: on phones the viewport height changes while the address bar slides,
// so clearing by viewport size would leave a strip of confetti stuck at the bottom.
function clearCanvas(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  context.save()
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.restore()
}

function animate(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  isAnimating = true
  const renderFrame = (now: number) => {
    clearCanvas(canvas, context)
    particles = particles.filter((particle) => particle.endTime > now)
    for (const particle of particles) {
      moveParticle(particle)
      drawParticle(context, particle)
    }
    if (particles.length) requestAnimationFrame(renderFrame)
    else isAnimating = false
  }
  requestAnimationFrame(renderFrame)
}

export function launchConfetti(colors: string[]) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const canvas = document.getElementById('confetti')
  if (!(canvas instanceof HTMLCanvasElement)) return
  const context = canvas.getContext('2d')
  if (!context) return

  // Several launches share one animation loop, so a new burst never fights an older one.
  if (!isAnimating) {
    const pixelRatio = devicePixelRatio || 1
    canvas.width = innerWidth * pixelRatio
    canvas.height = innerHeight * pixelRatio
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  }
  const endTime = performance.now() + ANIMATION_DURATION_MS
  particles.push(...Array.from({ length: PARTICLE_COUNT }, () => createParticle(colors, endTime)))
  if (!isAnimating) animate(canvas, context)
}
