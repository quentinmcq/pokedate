import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import sharp from 'sharp'
import type { StoredPokedex, StoredPokemon } from '../server/data/storedPokedex'
import { POKEMON_COUNT, POKEMON_TYPES } from '../shared/utils/pokemon'

const OUTPUT_DIR = join(import.meta.dirname, '..', 'generated')
const SPRITES_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
const CRIES_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest'
const PARALLEL_DOWNLOADS = 12
const DOWNLOAD_ATTEMPTS = 4
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 }

const pokedex = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', 'server', 'data', 'pokemon.json'), 'utf8'),
) as StoredPokedex

const artworkSourceUrl = (id: number, shiny: boolean) =>
  `${SPRITES_BASE_URL}/other/official-artwork/${shiny ? 'shiny/' : ''}${id}.png`
const spriteSourceUrl = (id: number, shiny: boolean) => `${SPRITES_BASE_URL}/${shiny ? 'shiny/' : ''}${id}.png`

const outputPath = (...segments: string[]) => join(OUTPUT_DIR, ...segments)

async function download(url: string): Promise<Buffer | null> {
  for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt++) {
    const response = await fetch(url).catch(() => null)
    if (response?.ok) return Buffer.from(await response.arrayBuffer())
    if (response?.status === 404) return null
    await new Promise((resolve) => setTimeout(resolve, 800 * attempt))
  }
  throw new Error(`Échec du téléchargement : ${url}`)
}

function writeOutput(path: string, content: Buffer) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

const ARTWORK_SIZE = 480
const ARTWORK_DRAWING_SIZE = 432

// Some shiny artworks are drawn larger than their regular version: trimming and recentring keeps both at one scale.
async function toArtworkWebp(image: Buffer) {
  const drawing = await sharp(image)
    .trim()
    .resize(ARTWORK_DRAWING_SIZE, ARTWORK_DRAWING_SIZE, { fit: 'inside' })
    .png()
    .toBuffer()
  return sharp({ create: { width: ARTWORK_SIZE, height: ARTWORK_SIZE, channels: 4, background: TRANSPARENT } })
    .composite([{ input: drawing, gravity: 'center' }])
    .webp({ quality: 80 })
    .toBuffer()
}

const toSpriteWebp = (image: Buffer) => sharp(image).webp({ lossless: true }).toBuffer()

const toSpriteFromArtwork = (image: Buffer) =>
  sharp(image).resize(96, 96, { fit: 'contain', background: TRANSPARENT }).webp({ quality: 85 }).toBuffer()

const XML_ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
const escapeXml = (text: string) => text.replace(/[&<>"]/g, (character) => XML_ENTITIES[character] ?? character)

function shareImageBackground({ id, fr: name, types }: StoredPokemon) {
  const [primaryType, secondaryType = primaryType] = types
  const primaryColor = POKEMON_TYPES[primaryType].color
  const secondaryColor = POKEMON_TYPES[secondaryType].color
  const nameFontSize = name.length > 11 ? 64 : 84
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="type" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${primaryColor}"/><stop offset="0.75" stop-color="#14162b"/></linearGradient>
    <radialGradient id="halo" cx="0.72" cy="0.5" r="0.42"><stop offset="0" stop-color="${secondaryColor}" stop-opacity="0.6"/><stop offset="1" stop-color="${secondaryColor}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#14162b"/>
  <rect width="1200" height="630" fill="url(#type)" opacity="0.55"/>
  <rect width="1200" height="630" fill="url(#halo)"/>
  <text x="70" y="250" font-family="Menlo, monospace" font-size="44" font-weight="700" fill="#ffd23f">N° ${String(id).padStart(4, '0')}</text>
  <text x="70" y="340" font-family="Helvetica, Arial, sans-serif" font-size="${nameFontSize}" font-weight="800" fill="#f4f3ff">${escapeXml(name)}</text>
  <text x="70" y="520" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="#f4f3ff">Poké<tspan fill="#ffd23f">Date</tspan></text>
  <text x="70" y="562" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#a9acd6">Quel Pokémon se cache dans ta date ?</text>
</svg>`)
}

async function toShareImage(pokemon: StoredPokemon, artwork: Buffer) {
  const resizedArtwork = await sharp(artwork).resize(540, 540, { fit: 'contain', background: TRANSPARENT }).toBuffer()
  return sharp(shareImageBackground(pokemon))
    .composite([{ input: resizedArtwork, left: 610, top: 45 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer()
}

const report = { spritesBuiltFromArtwork: 0, missingCries: [] as number[] }

async function downloadArtwork(id: number, shiny: boolean) {
  const artwork = await download(artworkSourceUrl(id, shiny))
  if (!artwork) throw new Error(`Artwork introuvable pour #${id}`)
  return artwork
}

async function generateShareImage(pokemon: StoredPokemon) {
  const path = outputPath('sprites', 'og', `${pokemon.id}.jpg`)
  if (existsSync(path)) return
  writeOutput(path, await toShareImage(pokemon, await downloadArtwork(pokemon.id, false)))
}

async function generateImages(id: number, shiny: boolean) {
  const artworkPath = outputPath('sprites', shiny ? 'art-shiny' : 'art', `${id}.webp`)
  const spritePath = outputPath('sprites', shiny ? 'mini-shiny' : 'mini', `${id}.webp`)

  if (!existsSync(artworkPath)) writeOutput(artworkPath, await toArtworkWebp(await downloadArtwork(id, shiny)))
  if (existsSync(spritePath)) return

  const sprite = await download(spriteSourceUrl(id, shiny))
  if (sprite) return writeOutput(spritePath, await toSpriteWebp(sprite))
  if (!shiny) report.spritesBuiltFromArtwork++
  writeOutput(spritePath, await toSpriteFromArtwork(await downloadArtwork(id, shiny)))
}

async function generateCry(id: number) {
  const path = outputPath('cries', `${id}.ogg`)
  if (existsSync(path)) return
  const cry = await download(`${CRIES_BASE_URL}/${id}.ogg`)
  if (cry) writeOutput(path, cry)
  else report.missingCries.push(id)
}

async function generatePokemonAssets(pokemon: StoredPokemon) {
  await generateShareImage(pokemon)
  await generateImages(pokemon.id, false)
  await generateImages(pokemon.id, true)
  await generateCry(pokemon.id)
}

const queue = pokedex.pokemon.slice(0, POKEMON_COUNT)
let processedCount = 0
await Promise.all(
  Array.from({ length: PARALLEL_DOWNLOADS }, async () => {
    for (let pokemon = queue.shift(); pokemon; pokemon = queue.shift()) {
      await generatePokemonAssets(pokemon)
      if (++processedCount % 100 === 0) console.info(`  ${processedCount}/${POKEMON_COUNT}`)
    }
  }),
)

console.info(`OK : ${POKEMON_COUNT} Pokémon dans generated/sprites (art, mini, og) et generated/cries`)
if (report.spritesBuiltFromArtwork)
  console.info(`Sprites fabriqués à partir de l'artwork : ${report.spritesBuiltFromArtwork}`)
if (report.missingCries.length) console.info(`Cris introuvables : ${report.missingCries.join(', ')}`)
