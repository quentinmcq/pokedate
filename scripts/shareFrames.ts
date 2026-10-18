import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { SHARE_FRAMES } from '../shared/utils/shareImages'

const WIDTH = 1200
const HEIGHT = 630
const BACKGROUND = '#14162b'
const GOLD = '#ffd23f'
const LAVENDER = '#7b7fc4'

const svg = (content: string) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">${content}</svg>`)

const dotPattern = `
  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1" fill="#ffffff" fill-opacity="0.06"/>
  </pattern>`

const halo = (id: string, color: string, opacity: number, centerX: number) => `
  <radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${centerX}" cy="320" r="320">
    <stop offset="0" stop-color="${color}" stop-opacity="${opacity}"/>
    <stop offset="1" stop-color="${color}" stop-opacity="0"/>
  </radialGradient>`

type DuelFrame = 'left' | 'right' | 'draw'

function duelFrame(winnerSide: DuelFrame) {
  const leftColor = winnerSide === 'right' ? LAVENDER : GOLD
  const rightColor = winnerSide === 'left' ? LAVENDER : GOLD
  const leftOpacity = winnerSide === 'right' ? 0.25 : winnerSide === 'draw' ? 0.35 : 0.5
  const rightOpacity = winnerSide === 'left' ? 0.25 : winnerSide === 'draw' ? 0.35 : 0.5
  return svg(`
  <defs>${dotPattern}${halo('left', leftColor, leftOpacity, 300)}${halo('right', rightColor, rightOpacity, 900)}</defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BACKGROUND}"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#dots)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#left)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#right)"/>
  <circle cx="600" cy="315" r="50" fill="#22254a" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>`)
}

const PODIUM_STEPS = [
  { x: 150, height: 120, color: '#c9cde6' },
  { x: 450, height: 170, color: GOLD },
  { x: 750, height: 90, color: '#d9915a' },
]

function tournamentFrame() {
  const steps = PODIUM_STEPS.map(
    ({ x, height, color }) => `
  <rect x="${x}" y="${HEIGHT - height}" width="300" height="${height + 20}" rx="18" fill="url(#step)"/>
  <rect x="${x}" y="${HEIGHT - height}" width="300" height="6" rx="3" fill="${color}"/>`,
  ).join('')
  return svg(`
  <defs>${dotPattern}${halo('champion', GOLD, 0.45, 600)}
    <linearGradient id="step" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2b2f5c"/><stop offset="1" stop-color="#1b1d38"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BACKGROUND}"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#dots)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#champion)"/>${steps}`)
}

const FRAME_SOURCES: Record<keyof typeof SHARE_FRAMES, Buffer> = {
  duelLeftWins: duelFrame('left'),
  duelRightWins: duelFrame('right'),
  duelDraw: duelFrame('draw'),
  tournament: tournamentFrame(),
}

export async function generateShareFrames(outputDir: string) {
  for (const [frame, source] of Object.entries(FRAME_SOURCES)) {
    const path = join(outputDir, SHARE_FRAMES[frame as keyof typeof SHARE_FRAMES])
    mkdirSync(join(path, '..'), { recursive: true })
    writeFileSync(path, await sharp(source).png({ compressionLevel: 9 }).toBuffer())
  }
}
