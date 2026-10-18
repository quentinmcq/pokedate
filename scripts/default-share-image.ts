import { join } from 'node:path'
import sharp from 'sharp'

const PROJECT_ROOT = join(import.meta.dirname, '..')
const MASCOT_ARTWORK = join(PROJECT_ROOT, 'generated', 'sprites', 'art', '25.webp')
const TITLE_LINES = {
  fr: { lines: ['Quel Pokémon', 'se cache dans', 'ta date ?'], number: 'N°', file: 'og-default.jpg' },
  en: { lines: ['Which Pokémon', 'hides in', 'your date?'], number: 'No.', file: 'og-default-en.jpg' },
}

const background = ({ lines, number }: (typeof TITLE_LINES)['fr']) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><radialGradient id="glow" cx="0.8" cy="0.1" r="0.7"><stop offset="0" stop-color="#ff4b3e" stop-opacity="0.45"/><stop offset="1" stop-color="#ff4b3e" stop-opacity="0"/></radialGradient></defs>
<rect width="1200" height="630" fill="#14162b"/><rect width="1200" height="630" fill="url(#glow)"/>
<text x="70" y="140" font-family="Helvetica, Arial, sans-serif" font-size="40" font-weight="800" fill="#f4f3ff">Poké<tspan fill="#ffd23f">Date</tspan></text>
${lines.map((line, index) => `<text x="70" y="${280 + index * 80}" font-family="Helvetica, Arial, sans-serif" font-size="68" font-weight="800" fill="#f4f3ff">${line}</text>`).join('\n')}
<text x="70" y="540" font-family="Menlo, monospace" font-size="30" font-weight="700" fill="#a9acd6">1<tspan fill="#ffd23f">7</tspan> / 1<tspan fill="#ffd23f">0</tspan> / 202<tspan fill="#ffd23f">6</tspan> → ${number} 706</text>
</svg>`)

const mascot = await sharp(MASCOT_ARTWORK).resize(470, 470).toBuffer()
for (const variant of Object.values(TITLE_LINES)) {
  const output = join(PROJECT_ROOT, 'public', variant.file)
  await sharp(background(variant))
    .composite([{ input: mascot, left: 680, top: 110 }])
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(output)
  console.info(`OK : ${output}`)
}
