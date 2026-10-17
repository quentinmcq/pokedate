import type { Fighter } from './duel'
import { resolveDuel } from './duel'
import { statTotal } from './pokemon'

export const TOURNAMENT_PLAYER_LIMITS = { min: 3, max: 8 } as const

const POINTS = { win: 3, draw: 1 } as const

export interface TournamentMatch {
  first: number
  second: number
  winner: number | null
}

export interface TournamentStanding {
  player: number
  points: number
  wins: number
  draws: number
  losses: number
}

export function resolveTournament(fighters: readonly Fighter[]) {
  const matches: TournamentMatch[] = []
  const standings: TournamentStanding[] = fighters.map((_, player) => ({
    player,
    points: 0,
    wins: 0,
    draws: 0,
    losses: 0,
  }))

  for (let first = 0; first < fighters.length; first++) {
    for (let second = first + 1; second < fighters.length; second++) {
      const { winner } = resolveDuel(fighters[first]!, fighters[second]!)
      const winnerIndex = winner === 'A' ? first : winner === 'B' ? second : null
      matches.push({ first, second, winner: winnerIndex })
      if (winnerIndex === null) {
        for (const player of [first, second]) {
          standings[player]!.draws++
          standings[player]!.points += POINTS.draw
        }
      } else {
        standings[winnerIndex]!.wins++
        standings[winnerIndex]!.points += POINTS.win
        standings[winnerIndex === first ? second : first]!.losses++
      }
    }
  }

  const statTotalOf = (standing: TournamentStanding) => statTotal(fighters[standing.player]!.stats)
  standings.sort((a, b) => b.points - a.points || statTotalOf(b) - statTotalOf(a) || a.player - b.player)
  return { matches, standings }
}
