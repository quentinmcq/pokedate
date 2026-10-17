import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const MAX = 1025
const ROOT = join(import.meta.dirname, '..', 'generated')
const SPR = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
const CRY = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest'

async function download(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url).catch(() => null)
    if (r?.ok) return Buffer.from(await r.arrayBuffer())
    if (r?.status === 404) return null
    await new Promise((res) => setTimeout(res, 800 * (i + 1)))
  }
  throw new Error(`Échec du téléchargement : ${url}`)
}

function save(path, data) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, data)
}

const artwork = (buf) => sharp(buf).resize(480, 480, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 })
const mini = (buf) => sharp(buf).webp({ lossless: true })
const miniFromArtwork = (buf) =>
  sharp(buf)
    .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 85 })

const DATA = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'server', 'data', 'pokemon.json'), 'utf8'))
const TYPE_COLORS = {
  normal: '#9FA19F',
  fire: '#D92B23',
  water: '#2980EF',
  electric: '#E0AE00',
  grass: '#3FA129',
  ice: '#3DCEF3',
  fighting: '#FF8000',
  poison: '#9141CB',
  ground: '#915121',
  flying: '#81B9EF',
  psychic: '#EF4179',
  bug: '#91A119',
  rock: '#AFA981',
  ghost: '#704170',
  dragon: '#5060E1',
  dark: '#624D4E',
  steel: '#60A1B8',
  fairy: '#EF70EF',
}
const xml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

function ogBackground({ id, fr, types }) {
  const c1 = TYPE_COLORS[types[0]]
  const c2 = TYPE_COLORS[types[1] ?? types[0]]
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="0.75" stop-color="#14162b"/></linearGradient>
    <radialGradient id="h" cx="0.72" cy="0.5" r="0.42"><stop offset="0" stop-color="${c2}" stop-opacity="0.6"/><stop offset="1" stop-color="${c2}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#14162b"/>
  <rect width="1200" height="630" fill="url(#g)" opacity="0.55"/>
  <rect width="1200" height="630" fill="url(#h)"/>
  <text x="70" y="250" font-family="Menlo, monospace" font-size="44" font-weight="700" fill="#ffd23f">N° ${String(id).padStart(4, '0')}</text>
  <text x="70" y="340" font-family="Helvetica, Arial, sans-serif" font-size="${fr.length > 11 ? 64 : 84}" font-weight="800" fill="#f4f3ff">${xml(fr)}</text>
  <text x="70" y="520" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="#f4f3ff">Poké<tspan fill="#ffd23f">Date</tspan></text>
  <text x="70" y="562" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#a9acd6">Quel Pokémon se cache dans ta date ?</text>
</svg>`)
}

async function ogImage(p, artBuf) {
  const art = await sharp(artBuf)
    .resize(540, 540, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  return sharp(ogBackground(p))
    .composite([{ input: art, left: 610, top: 45 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer()
}

const missing = { mini: [], cry: [] }

async function handle(id) {
  const ogPath = join(ROOT, 'sprites', 'og', `${id}.jpg`)
  if (!existsSync(ogPath)) {
    const artBuf = await download(`${SPR}/other/official-artwork/${id}.png`)
    save(ogPath, await ogImage(DATA.pokemon[id - 1], artBuf))
  }
  for (const shiny of [false, true]) {
    const s = shiny ? 'shiny/' : ''
    const artPath = join(ROOT, 'sprites', shiny ? 'art-shiny' : 'art', `${id}.webp`)
    const miniPath = join(ROOT, 'sprites', shiny ? 'mini-shiny' : 'mini', `${id}.webp`)
    let artBuf
    if (!existsSync(artPath)) {
      artBuf = await download(`${SPR}/other/official-artwork/${s}${id}.png`)
      if (!artBuf) throw new Error(`Artwork introuvable pour #${id}`)
      save(artPath, await artwork(artBuf).toBuffer())
    }
    if (!existsSync(miniPath)) {
      const miniBuf = await download(`${SPR}/${s}${id}.png`)
      if (miniBuf) save(miniPath, await mini(miniBuf).toBuffer())
      else {
        if (!shiny) missing.mini.push(id)
        artBuf ??= await download(`${SPR}/other/official-artwork/${s}${id}.png`)
        save(miniPath, await miniFromArtwork(artBuf).toBuffer())
      }
    }
  }
  const cryPath = join(ROOT, 'cries', `${id}.ogg`)
  if (!existsSync(cryPath)) {
    const cry = await download(`${CRY}/${id}.ogg`)
    if (cry) save(cryPath, cry)
    else missing.cry.push(id)
  }
}

const ids = Array.from({ length: MAX }, (_, i) => i + 1)
let next = 0
let done = 0
await Promise.all(
  Array.from({ length: 12 }, async () => {
    while (next < ids.length) {
      const id = ids[next++]
      await handle(id)
      if (++done % 100 === 0) console.error(`  ${done}/${MAX}`)
    }
  }),
)
console.error(`OK : ${MAX} Pokémon dans public/sprites (art, mini, og) et public/cries`)
if (missing.mini.length) console.error(`Petits sprites générés depuis l'artwork : ${missing.mini.length}`)
if (missing.cry.length) console.error(`Cris introuvables : ${missing.cry.join(', ')}`)
