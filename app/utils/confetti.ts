const PARTICLE_COUNT = 160
const ANIMATION_DURATION_MS = 3000
const GRAVITY = 0.35
const AIR_RESISTANCE = 0.99

interface ConfettiParticle {
  x: number
  y: number
  velocityX: number
  velocityY: number
  size: number
  rotation: number
  rotationSpeed: number
  color: string
}

function createParticle(colors: string[]): ConfettiParticle {
  return {
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

export function launchConfetti(colors: string[]) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const canvas = document.getElementById('confetti')
  if (!(canvas instanceof HTMLCanvasElement)) return
  const context = canvas.getContext('2d')
  if (!context) return

  const pixelRatio = devicePixelRatio || 1
  canvas.width = innerWidth * pixelRatio
  canvas.height = innerHeight * pixelRatio
  context.scale(pixelRatio, pixelRatio)

  const particles = Array.from({ length: PARTICLE_COUNT }, () => createParticle(colors))
  const startTime = performance.now()

  const renderFrame = (now: number) => {
    context.clearRect(0, 0, innerWidth, innerHeight)
    for (const particle of particles) {
      moveParticle(particle)
      drawParticle(context, particle)
    }
    if (now - startTime < ANIMATION_DURATION_MS) requestAnimationFrame(renderFrame)
    else context.clearRect(0, 0, innerWidth, innerHeight)
  }
  requestAnimationFrame(renderFrame)
}
