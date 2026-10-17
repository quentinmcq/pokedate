import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url))
const BACKGROUND = '#14162b'
const favicon = readFileSync(`${PUBLIC_DIR}favicon.svg`)

async function renderIcon(fileName: string, size: number, { padding = 0, background = '' } = {}) {
  const ballSize = Math.round(size * (1 - padding * 2))
  const ball = await sharp(favicon, { density: 600 }).resize(ballSize, ballSize).png().toBuffer()
  const canvas = sharp({
    create: { width: size, height: size, channels: 4, background: background || { r: 0, g: 0, b: 0, alpha: 0 } },
  })
  await canvas
    .composite([{ input: ball, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(`${PUBLIC_DIR}icons/${fileName}`)
  console.info(`icons/${fileName}`)
}

await renderIcon('icon-192.png', 192)
await renderIcon('icon-512.png', 512)
await renderIcon('icon-maskable-512.png', 512, { padding: 0.2, background: BACKGROUND })
await renderIcon('apple-touch-icon.png', 180, { padding: 0.12, background: BACKGROUND })
