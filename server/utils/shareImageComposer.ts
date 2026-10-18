import type { Translate } from '../../shared/utils/messages'
import { SHARE_FRAMES, type SharedFighter } from '../../shared/utils/shareImages'

interface DrawPosition {
  left?: number
  right?: number
  top?: number
  opacity?: number
}

export interface ImageLayer {
  transform: (options: { width: number }) => ImageLayer
  draw: (overlay: ImageLayer, position?: DrawPosition) => ImageLayer
  output: (options: { format: 'image/jpeg'; quality: number }) => Promise<{ response: () => Response }>
}

export interface ImagesBinding {
  input: (stream: ReadableStream) => ImageLayer
  text: (content: string, options: { font: { url: string }; color: string; size: number }) => ImageLayer
}

export interface ShareImageTools {
  images: ImagesBinding
  loadAsset: (path: string) => Promise<ReadableStream>
  fontUrl: string
}

export interface ShareImageFighter extends SharedFighter {
  name: string
}

type Layer =
  | { kind: 'artwork'; fighter: SharedFighter; width: number; position: DrawPosition }
  | { kind: 'text'; content: string; size: number; color: string; position: DrawPosition }

export interface ShareImageComposition {
  frame: string
  layers: Layer[]
}

const WIDTH = 1200
const COLORS = { gold: '#ffd23f', text: '#f4f3ff', muted: '#a9acd6' }
const LOSER_OPACITY = 0.45

// The Images binding cannot measure text: an average glyph width of Bricolage Grotesque ExtraBold
// is close enough to centre short labels under an artwork.
const AVERAGE_GLYPH_WIDTH = 0.56
const centeredAt = (centerX: number, content: string, size: number) =>
  Math.round(centerX - (content.length * size * AVERAGE_GLYPH_WIDTH) / 2)

const artworkPath = ({ pokemonId, shiny }: SharedFighter) => `/sprites/${shiny ? 'art-shiny' : 'art'}/${pokemonId}.webp`

const headerLayers = (title: string): Layer[] => [
  { kind: 'text', content: title, size: 54, color: COLORS.gold, position: { top: 34 } },
  { kind: 'text', content: 'pokedate.fr', size: 24, color: COLORS.muted, position: { top: 104 } },
]

export function duelLayers(
  t: Translate,
  fighterA: ShareImageFighter,
  fighterB: ShareImageFighter,
  winner: 'A' | 'B' | null,
): ShareImageComposition {
  const title = winner
    ? t('shareImage.duelWinner', { pokemon: (winner === 'A' ? fighterA : fighterB).name })
    : fighterA.pokemonId === fighterB.pokemonId
      ? t('shareImage.mirror')
      : t('shareImage.draw')
  const opacityOf = (side: 'A' | 'B') => (winner && winner !== side ? LOSER_OPACITY : 1)
  const nameColorOf = (side: 'A' | 'B') => (winner && winner !== side ? COLORS.muted : COLORS.text)
  const layers: Layer[] = [
    ...headerLayers(title),
    { kind: 'artwork', fighter: fighterA, width: 360, position: { left: 120, top: 140, opacity: opacityOf('A') } },
    { kind: 'artwork', fighter: fighterB, width: 360, position: { right: 120, top: 140, opacity: opacityOf('B') } },
    { kind: 'text', content: 'VS', size: 40, color: COLORS.text, position: {} },
    {
      kind: 'text',
      content: fighterA.name,
      size: 38,
      color: nameColorOf('A'),
      position: { left: centeredAt(300, fighterA.name, 38), top: 505 },
    },
    {
      kind: 'text',
      content: fighterB.name,
      size: 38,
      color: nameColorOf('B'),
      position: { left: centeredAt(WIDTH - 300, fighterB.name, 38), top: 505 },
    },
  ]
  const frame =
    winner === 'A' ? SHARE_FRAMES.duelLeftWins : winner === 'B' ? SHARE_FRAMES.duelRightWins : SHARE_FRAMES.duelDraw
  return { frame, layers }
}

export function tournamentLayers(
  t: Translate,
  [champion, second, third]: readonly ShareImageFighter[],
): ShareImageComposition {
  const layers: Layer[] = [
    ...headerLayers(t('shareImage.tournamentWinner', { pokemon: champion!.name })),
    { kind: 'artwork', fighter: second!, width: 240, position: { left: 180, top: 280 } },
    { kind: 'artwork', fighter: third!, width: 220, position: { left: 790, top: 322 } },
    { kind: 'artwork', fighter: champion!, width: 300, position: { left: 450, top: 170 } },
  ]
  return { frame: SHARE_FRAMES.tournament, layers }
}

// The binding sends every image overlay before every text overlay but keeps the positions in call
// order: drawing the artworks first, then the texts, keeps each position on its own layer.
const drawingOrder = (layers: Layer[]) => [
  ...layers.filter((layer) => layer.kind === 'artwork'),
  ...layers.filter((layer) => layer.kind === 'text'),
]

export async function renderShareImage(tools: ShareImageTools, { frame, layers }: ShareImageComposition) {
  let image = tools.images.input(await tools.loadAsset(`/${frame}`))
  for (const layer of drawingOrder(layers)) {
    const overlay =
      layer.kind === 'artwork'
        ? tools.images.input(await tools.loadAsset(artworkPath(layer.fighter))).transform({ width: layer.width })
        : tools.images.text(layer.content, { font: { url: tools.fontUrl }, color: layer.color, size: layer.size })
    image = image.draw(overlay, layer.position)
  }
  const output = await image.output({ format: 'image/jpeg', quality: 85 })
  return output.response()
}
