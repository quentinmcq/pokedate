import { describe, expect, it } from 'vitest'
import type { PokedexEntry } from '../../shared/types/pokemon'
import { goalId, nextGoals, pokedexGoals } from '../../shared/utils/pokedexGoals'
import { listPokedexEntries } from '../../server/utils/pokedex'

const entries: PokedexEntry[] = listPokedexEntries()
const caughtIds = (ids: number[], shinyIds: number[] = []) => ids.map((id) => ({ id, shiny: shinyIds.includes(id) }))
const goalOf = (goals: ReturnType<typeof pokedexGoals>, key: string, target?: number) =>
  goals.find((goal) => goal.key === key && (target === undefined || goal.target === target))!

describe('objectifs du Pokédex', () => {
  it('part de zéro avec un Pokédex vide', () => {
    const goals = pokedexGoals([], entries)
    expect(goals.every((goal) => !goal.done && goal.current === 0)).toBe(true)
  })

  it('compte les Pokémon, les shiny et les starters', () => {
    const goals = pokedexGoals(caughtIds([1, 4, 7, 25], [25]), entries)
    expect(goalOf(goals, 'firstCatch').done).toBe(true)
    expect(goalOf(goals, 'collection', 10)).toMatchObject({ current: 4, done: false })
    expect(goalOf(goals, 'firstShiny').done).toBe(true)
    expect(goalOf(goals, 'kantoStarters').done).toBe(true)
    expect(goalOf(goals, 'generation', 151)).toMatchObject({ current: 4, params: { roman: 'I', region: 'kanto' } })
  })

  it('reconnaît les légendaires, les fabuleux, les types et les Pokémon bonus', () => {
    const goals = pokedexGoals(caughtIds([150, 151, 1010]), entries)
    expect(goalOf(goals, 'legendary').done).toBe(true)
    expect(goalOf(goals, 'mythical').done).toBe(true)
    expect(goalOf(goals, 'bonus').done).toBe(true)
    expect(goalOf(goals, 'allTypes').current).toBeGreaterThan(0)
  })

  it('donne à chaque objectif un identifiant unique', () => {
    const ids = pokedexGoals([], entries).map(goalId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('propose d’abord les objectifs les plus avancés', () => {
    const goals = pokedexGoals(caughtIds([1, 4]), entries)
    expect(nextGoals(goals, 1)[0]!.key).toBe('kantoStarters')
  })
})
