import type { PokemonDetail, TypeKey } from '../types/pokemon'
import { statTotal, typeEffectiveness } from './pokemon'

export type Fighter = Pick<PokemonDetail, 'id' | 'types' | 'stats'>
export type DuelSide = 'A' | 'B'

export interface AttackSummary {
  type: TypeKey
  multiplier: number
  damage: number
  turnsToKnockOut: number
}

export interface DuelOutcome {
  attackOfA: AttackSummary
  attackOfB: AttackSummary
  firstStriker: DuelSide
  winner: DuelSide | null
}

const LEVEL_FACTOR = 22
const MOVE_POWER = 80
const SAME_TYPE_BONUS = 1.5
const LEVEL_50_STAT_BONUS = 5
const LEVEL_50_HP_BONUS = 60

export function computeAttack(attacker: Fighter, defender: Fighter): AttackSummary {
  const isPhysical = attacker.stats.attack >= attacker.stats.specialAttack
  const attackStat = (isPhysical ? attacker.stats.attack : attacker.stats.specialAttack) + LEVEL_50_STAT_BONUS
  const defenseStat = (isPhysical ? defender.stats.defense : defender.stats.specialDefense) + LEVEL_50_STAT_BONUS

  const bestAttack = attacker.types
    .map((type) => ({ type, multiplier: typeEffectiveness(type, defender.types) }))
    .reduce((best, candidate) => (candidate.multiplier > best.multiplier ? candidate : best))

  const baseDamage = (LEVEL_FACTOR * MOVE_POWER * attackStat) / defenseStat / 50 + 2
  const damage = Math.floor(baseDamage * SAME_TYPE_BONUS * bestAttack.multiplier)
  const defenderHp = defender.stats.hp + LEVEL_50_HP_BONUS
  const turnsToKnockOut = damage > 0 ? Math.ceil(defenderHp / damage) : Infinity

  return { ...bestAttack, damage, turnsToKnockOut }
}

export function resolveDuel(fighterA: Fighter, fighterB: Fighter): DuelOutcome {
  const attackOfA = computeAttack(fighterA, fighterB)
  const attackOfB = computeAttack(fighterB, fighterA)

  const aIsFaster =
    fighterA.stats.speed > fighterB.stats.speed ||
    (fighterA.stats.speed === fighterB.stats.speed && statTotal(fighterA.stats) >= statTotal(fighterB.stats))
  const firstStriker: DuelSide = aIsFaster ? 'A' : 'B'

  const nobodyCanHit = attackOfA.turnsToKnockOut === Infinity && attackOfB.turnsToKnockOut === Infinity
  let winner: DuelSide | null = null
  if (fighterA.id !== fighterB.id && !nobodyCanHit) {
    if (firstStriker === 'A') winner = attackOfA.turnsToKnockOut <= attackOfB.turnsToKnockOut ? 'A' : 'B'
    else winner = attackOfB.turnsToKnockOut <= attackOfA.turnsToKnockOut ? 'B' : 'A'
  }

  return { attackOfA, attackOfB, firstStriker, winner }
}

export function describeEffectiveness(multiplier: number) {
  if (multiplier === 0) return "n'a aucun effet"
  if (multiplier >= 4) return 'est ultra efficace'
  if (multiplier >= 2) return 'est super efficace'
  if (multiplier < 1) return "n'est pas très efficace…"
  return 'touche normalement'
}

export const describeKnockOut = (turns: number) =>
  turns === Infinity ? 'ne peut pas le toucher' : `le met K.O. en ${turns} tour${turns > 1 ? 's' : ''}`
