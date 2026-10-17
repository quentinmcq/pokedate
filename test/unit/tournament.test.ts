import { describe, expect, it } from 'vitest'
import type { Fighter } from '../../shared/utils/duel'
import { resolveTournament } from '../../shared/utils/tournament'

const fighter = (
  id: number,
  types: Fighter['types'],
  [hp, attack, defense, specialAttack, specialDefense, speed]: number[],
) => ({ id, types, stats: { hp, attack, defense, specialAttack, specialDefense, speed } }) as Fighter

const pikachu = fighter(25, ['electric'], [35, 55, 40, 50, 50, 90])
const racaillou = fighter(74, ['rock', 'ground'], [40, 80, 100, 30, 30, 20])
const fantominus = fighter(92, ['ghost'], [30, 35, 30, 100, 35, 80])
const rattata = fighter(19, ['normal'], [30, 56, 35, 25, 35, 72])

describe('resolveTournament', () => {
  it('fait s’affronter chaque joueur contre tous les autres une fois', () => {
    const { matches } = resolveTournament([pikachu, racaillou, fantominus, rattata])
    expect(matches).toHaveLength(6)
    expect(new Set(matches.map(({ first, second }) => `${first}-${second}`)).size).toBe(6)
  })

  it('compte 3 points par victoire, 1 par match nul, et classe du meilleur au moins bon', () => {
    const { standings, matches } = resolveTournament([pikachu, racaillou, fantominus, rattata])
    for (const standing of standings) {
      expect(standing.wins + standing.draws + standing.losses).toBe(3)
      expect(standing.points).toBe(standing.wins * 3 + standing.draws)
    }
    const pointsInOrder = standings.map((standing) => standing.points)
    expect(pointsInOrder).toEqual(pointsInOrder.toSorted((a, b) => b - a))
    const totalPoints = standings.reduce((sum, { points }) => sum + points, 0)
    const draws = matches.filter(({ winner }) => winner === null).length
    expect(totalPoints).toBe((matches.length - draws) * 3 + draws * 2)
  })

  it('départage une égalité de points avec le total des stats', () => {
    const { standings } = resolveTournament([rattata, rattata, rattata])
    expect(standings.every(({ draws, points }) => draws === 2 && points === 2)).toBe(true)
    expect(standings.map(({ player }) => player)).toEqual([0, 1, 2])
  })
})
