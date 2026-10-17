import { join } from 'node:path'
import sharp from 'sharp'

const PROJECT_ROOT = join(import.meta.dirname, '..')
const MASCOT_ARTWORK = join(PROJECT_ROOT, 'generated', 'sprites', 'art', '25.webp')
const OUTPUT = join(PROJECT_ROOT, 'public', 'og-default.jpg')

const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><radialGradient id="glow" cx="0.8" cy="0.1" r="0.7"><stop offset="0" stop-color="#ff4b3e" stop-opacity="0.45"/><stop offset="1" stop-color="#ff4b3e" stop-opacity="0"/></radialGradient></defs>
<rect width="1200" height="630" fill="#14162b"/><rect width="1200" height="630" fill="url(#glow)"/>
<text x="70" y="140" font-family="Helvetica, Arial, sans-serif" font-size="40" font-weight="800" fill="#f4f3ff">Poké<tspan fill="#ffd23f">Date</tspan></text>
<text x="70" y="280" font-family="Helvetica, Arial, sans-serif" font-size="68" font-weight="800" fill="#f4f3ff">Quel Pokémon</text>
<text x="70" y="360" font-family="Helvetica, Arial, sans-serif" font-size="68" font-weight="800" fill="#f4f3ff">se cache dans</text>
<text x="70" y="440" font-family="Helvetica, Arial, sans-serif" font-size="68" font-weight="800" fill="#f4f3ff">ta date ?</text>
<text x="70" y="540" font-family="Menlo, monospace" font-size="30" font-weight="700" fill="#a9acd6">1<tspan fill="#ffd23f">7</tspan> / 1<tspan fill="#ffd23f">0</tspan> / 202<tspan fill="#ffd23f">6</tspan> → N° 706</text>
</svg>`)

const mascot = await sharp(MASCOT_ARTWORK).resize(470, 470).toBuffer()
await sharp(background)
  .composite([{ input: mascot, left: 680, top: 110 }])
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(OUTPUT)
console.info(`OK : ${OUTPUT}`)
