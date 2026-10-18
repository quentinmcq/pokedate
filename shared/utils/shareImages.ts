import { POKEMON_COUNT } from './pokemon'

export const SHARE_FRAMES = {
  duelLeftWins: 'og/frames/duel-left.png',
  duelRightWins: 'og/frames/duel-right.png',
  duelDraw: 'og/frames/duel-draw.png',
  tournament: 'og/frames/tournament.png',
} as const

export const SHARE_FONT_PATH = '/og/bricolage-grotesque-800.ttf'

export interface SharedFighter {
  pokemonId: number
  shiny: boolean
}

const fighterSegment = ({ pokemonId, shiny }: SharedFighter) => `${pokemonId}${shiny ? 's' : ''}`

export const duelShareImagePath = (fighterA: SharedFighter, fighterB: SharedFighter) =>
  `/og/duel/${fighterSegment(fighterA)}-${fighterSegment(fighterB)}.jpg`

export const tournamentShareImagePath = (podium: readonly SharedFighter[]) =>
  `/og/tournoi/${podium.map(fighterSegment).join('-')}.jpg`

const FIGHTER_SEGMENT = /^([1-9]\d{0,3})(s?)$/

export function parseSharedFighters(fileName: string, count: number): SharedFighter[] | null {
  const segments = fileName.replace(/\.jpg$/, '').split('-')
  if (!fileName.endsWith('.jpg') || segments.length !== count) return null
  const fighters: SharedFighter[] = []
  for (const segment of segments) {
    const match = FIGHTER_SEGMENT.exec(segment)
    const pokemonId = Number(match?.[1])
    if (!match || pokemonId < 1 || pokemonId > POKEMON_COUNT) return null
    fighters.push({ pokemonId, shiny: match[2] === 's' })
  }
  return fighters
}
