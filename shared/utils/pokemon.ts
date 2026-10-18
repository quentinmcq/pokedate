import type { BaseStats, StatKey, TypeKey } from '../types/pokemon'

export const POKEMON_COUNT = 1025

export const artworkUrl = (id: number, shiny = false) => `/sprites/${shiny ? 'art-shiny' : 'art'}/${id}.webp`
export const spriteUrl = (id: number, shiny = false) => `/sprites/${shiny ? 'mini-shiny' : 'mini'}/${id}.webp`
export const shareImagePath = (id: number) => `/sprites/og/${id}.jpg`
export const cryUrl = (id: number) => `/cries/${id}.ogg`

export interface PokemonTypeStyle {
  label: string
  color: string
  icon: string
  textColor: string
}

const DARK_TEXT = '#14162b'
const LIGHT_TEXT = '#ffffff'

export const POKEMON_TYPES: Record<TypeKey, PokemonTypeStyle> = {
  normal: { label: 'Normal', color: '#9FA19F', icon: 'lucide:circle-dot', textColor: DARK_TEXT },
  fire: { label: 'Feu', color: '#D92B23', icon: 'lucide:flame', textColor: LIGHT_TEXT },
  water: { label: 'Eau', color: '#2980EF', icon: 'lucide:droplet', textColor: DARK_TEXT },
  electric: { label: 'Électrik', color: '#E0AE00', icon: 'lucide:zap', textColor: DARK_TEXT },
  grass: { label: 'Plante', color: '#3FA129', icon: 'lucide:leaf', textColor: DARK_TEXT },
  ice: { label: 'Glace', color: '#3DCEF3', icon: 'lucide:snowflake', textColor: DARK_TEXT },
  fighting: { label: 'Combat', color: '#FF8000', icon: 'lucide:hand-fist', textColor: DARK_TEXT },
  poison: { label: 'Poison', color: '#9141CB', icon: 'lucide:flask-conical', textColor: LIGHT_TEXT },
  ground: { label: 'Sol', color: '#915121', icon: 'lucide:mountain', textColor: LIGHT_TEXT },
  flying: { label: 'Vol', color: '#81B9EF', icon: 'lucide:feather', textColor: DARK_TEXT },
  psychic: { label: 'Psy', color: '#EF4179', icon: 'lucide:eye', textColor: DARK_TEXT },
  bug: { label: 'Insecte', color: '#91A119', icon: 'lucide:bug', textColor: DARK_TEXT },
  rock: { label: 'Roche', color: '#AFA981', icon: 'lucide:mountain-snow', textColor: DARK_TEXT },
  ghost: { label: 'Spectre', color: '#704170', icon: 'lucide:ghost', textColor: LIGHT_TEXT },
  dragon: { label: 'Dragon', color: '#5060E1', icon: 'lucide:gem', textColor: LIGHT_TEXT },
  dark: { label: 'Ténèbres', color: '#624D4E', icon: 'lucide:moon', textColor: LIGHT_TEXT },
  steel: { label: 'Acier', color: '#60A1B8', icon: 'lucide:shield', textColor: DARK_TEXT },
  fairy: { label: 'Fée', color: '#EF70EF', icon: 'lucide:wand-sparkles', textColor: DARK_TEXT },
}

export const TYPE_KEYS = Object.keys(POKEMON_TYPES) as TypeKey[]
export const typeColor = (type: TypeKey) => POKEMON_TYPES[type].color

const OFFENSIVE_MULTIPLIERS: Record<TypeKey, Partial<Record<TypeKey, number>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
}

export const typeEffectiveness = (attackType: TypeKey, defenderTypes: readonly TypeKey[]) =>
  defenderTypes.reduce(
    (multiplier, defenderType) => multiplier * (OFFENSIVE_MULTIPLIERS[attackType][defenderType] ?? 1),
    1,
  )

export interface TypeMatchup {
  type: TypeKey
  multiplier: number
}

export interface DefensiveMatchups {
  weaknesses: TypeMatchup[]
  resistances: TypeMatchup[]
  immunities: TypeMatchup[]
}

export function defensiveMatchups(defenderTypes: readonly TypeKey[]): DefensiveMatchups {
  const matchups: DefensiveMatchups = { weaknesses: [], resistances: [], immunities: [] }
  for (const type of TYPE_KEYS) {
    const multiplier = typeEffectiveness(type, defenderTypes)
    if (multiplier === 0) matchups.immunities.push({ type, multiplier })
    else if (multiplier > 1) matchups.weaknesses.push({ type, multiplier })
    else if (multiplier < 1) matchups.resistances.push({ type, multiplier })
  }
  matchups.weaknesses.sort((a, b) => b.multiplier - a.multiplier)
  return matchups
}

const MULTIPLIER_LABELS: Record<number, string> = { 0: '×0', 0.25: '×¼', 0.5: '×½', 1: '×1', 2: '×2', 4: '×4' }
export const formatMultiplier = (multiplier: number) => MULTIPLIER_LABELS[multiplier] ?? `×${multiplier}`

export const STAT_KEYS: StatKey[] = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed']

export const STAT_LABELS: Record<StatKey, string> = {
  hp: 'PV',
  attack: 'Attaque',
  defense: 'Défense',
  specialAttack: 'Atq. Spé.',
  specialDefense: 'Déf. Spé.',
  speed: 'Vitesse',
}

export const statTotal = (stats: BaseStats) => STAT_KEYS.reduce((total, key) => total + stats[key], 0)

export const strongestStat = (stats: BaseStats): StatKey =>
  STAT_KEYS.reduce((best, key) => (stats[key] > stats[best] ? key : best), STAT_KEYS[0]!)

export interface Generation {
  roman: string
  region: string
  firstId: number
  lastId: number
}

export const GENERATIONS: Generation[] = [
  { roman: 'I', region: 'Kanto', firstId: 1, lastId: 151 },
  { roman: 'II', region: 'Johto', firstId: 152, lastId: 251 },
  { roman: 'III', region: 'Hoenn', firstId: 252, lastId: 386 },
  { roman: 'IV', region: 'Sinnoh', firstId: 387, lastId: 493 },
  { roman: 'V', region: 'Unys', firstId: 494, lastId: 649 },
  { roman: 'VI', region: 'Kalos', firstId: 650, lastId: 721 },
  { roman: 'VII', region: 'Alola', firstId: 722, lastId: 809 },
  { roman: 'VIII', region: 'Galar', firstId: 810, lastId: 905 },
  { roman: 'IX', region: 'Paldea', firstId: 906, lastId: 1025 },
]

export const generationOf = (generationNumber: number) => GENERATIONS[generationNumber - 1]

export const formatNumber = (value: number, maxDecimals = 1) =>
  value.toLocaleString('fr-FR', { maximumFractionDigits: maxDecimals })

export const padNumber = (value: number | string, length = 2) => String(value).padStart(length, '0')

const AVERAGE_HUMAN_HEIGHT_METERS = 1.7

export function describeHeight(heightMeters: number) {
  if (heightMeters <= 0.3) return 'Tient dans ta poche'
  if (heightMeters <= 0.7) return 'Tient dans ton sac à dos'
  if (heightMeters < 1.4) return "T'arrive à peu près à la ceinture"
  if (heightMeters <= 2) return 'À peu près aussi grand que toi'
  return `${formatNumber(heightMeters / AVERAGE_HUMAN_HEIGHT_METERS)} fois plus grand que toi`
}

export const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const pokemonPath = (pokemon: { id: number; name: string }) => `/pokemon/${pokemon.id}-${slugify(pokemon.name)}`
