import type { PokedexEntry } from '../types/pokemon'
import { LAST_DATE_POKEMON_ID } from './date'
import { GENERATIONS, POKEMON_COUNT, TYPE_KEYS } from './pokemon'

export interface CaughtPokemon {
  id: number
  shiny: boolean
}

export interface GoalProgress {
  key: string
  icon: string
  current: number
  target: number
  done: boolean
  params?: Record<string, string | number>
}

interface GoalContext {
  caught: CaughtPokemon[]
  entries: ReadonlyMap<number, PokedexEntry>
}

interface GoalDefinition {
  key: string
  icon: string
  target: number
  params?: Record<string, string | number>
  count: (context: GoalContext) => number
}

const KANTO_STARTERS = [1, 4, 7]
const EEVEE_FAMILY = [133, 134, 135, 136, 196, 197, 470, 471, 700]
const COLLECTION_MILESTONES = [10, 50, 150, 500]
const SHINY_MILESTONES = [1, 5]

const countIn = (caught: CaughtPokemon[], ids: readonly number[]) =>
  caught.filter((pokemon) => ids.includes(pokemon.id)).length

const countInRange = (caught: CaughtPokemon[], firstId: number, lastId: number) =>
  caught.filter((pokemon) => pokemon.id >= firstId && pokemon.id <= lastId).length

const countRarity = ({ caught, entries }: GoalContext, rarity: PokedexEntry['rarity']) =>
  caught.filter((pokemon) => entries.get(pokemon.id)?.rarity === rarity).length

function countCaughtTypes({ caught, entries }: GoalContext) {
  const types = new Set(caught.flatMap((pokemon) => entries.get(pokemon.id)?.types ?? []))
  return types.size
}

const GOALS: GoalDefinition[] = [
  { key: 'firstCatch', icon: 'lucide:circle-dot', target: 1, count: ({ caught }) => caught.length },
  ...COLLECTION_MILESTONES.map((target) => ({
    key: 'collection',
    icon: 'lucide:library',
    target,
    params: { count: target },
    count: ({ caught }: GoalContext) => caught.length,
  })),
  ...SHINY_MILESTONES.map((target) => ({
    key: target === 1 ? 'firstShiny' : 'shinies',
    icon: 'lucide:sparkles',
    target,
    params: { count: target },
    count: ({ caught }: GoalContext) => caught.filter((pokemon) => pokemon.shiny).length,
  })),
  { key: 'allTypes', icon: 'lucide:palette', target: TYPE_KEYS.length, count: countCaughtTypes },
  { key: 'legendary', icon: 'lucide:crown', target: 1, count: (context) => countRarity(context, 'legendary') },
  { key: 'mythical', icon: 'lucide:wand-sparkles', target: 1, count: (context) => countRarity(context, 'mythical') },
  {
    key: 'bonus',
    icon: 'lucide:moon-star',
    target: 1,
    count: ({ caught }) => countInRange(caught, LAST_DATE_POKEMON_ID + 1, POKEMON_COUNT),
  },
  {
    key: 'kantoStarters',
    icon: 'lucide:flame',
    target: KANTO_STARTERS.length,
    count: ({ caught }) => countIn(caught, KANTO_STARTERS),
  },
  {
    key: 'eeveeFamily',
    icon: 'lucide:git-fork',
    target: EEVEE_FAMILY.length,
    count: ({ caught }) => countIn(caught, EEVEE_FAMILY),
  },
  ...GENERATIONS.map((generation) => ({
    key: 'generation',
    icon: 'lucide:map',
    target: generation.lastId - generation.firstId + 1,
    params: { roman: generation.roman, region: generation.region },
    count: ({ caught }: GoalContext) => countInRange(caught, generation.firstId, generation.lastId),
  })),
]

export const GOAL_ICONS = [...new Set(GOALS.map((goal) => goal.icon))]

// Each goal gets a stable id, so that a goal already celebrated is never celebrated again.
export const goalId = (goal: Pick<GoalProgress, 'key' | 'target' | 'params'>) =>
  [goal.key, goal.target, goal.params?.roman].filter((part) => part !== undefined).join(':')

export function pokedexGoals(caught: CaughtPokemon[], entries: readonly PokedexEntry[]): GoalProgress[] {
  const context = { caught, entries: new Map(entries.map((entry) => [entry.id, entry])) }
  return GOALS.map(({ key, icon, target, params, count }) => {
    const current = Math.min(count(context), target)
    return { key, icon, target, current, done: current >= target, ...(params ? { params } : {}) }
  })
}

const progressRatio = (goal: GoalProgress) => goal.current / goal.target

export const nextGoals = (goals: GoalProgress[], limit: number) =>
  goals
    .filter((goal) => !goal.done)
    .toSorted((a, b) => progressRatio(b) - progressRatio(a) || a.target - b.target)
    .slice(0, limit)
