import type { Locale, PokemonDetail, TypeKey } from '../types/pokemon'
import { formatNumber, statTotal, typeEffectiveness } from './pokemon'
import type { Translate } from './messages'

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

export function describeEffectiveness(t: Translate, multiplier: number, locale: Locale) {
  const factor = `(×${formatNumber(multiplier, locale, 2)})`
  if (multiplier >= 4) return t('duelStory.effectiveness.ultra', { factor })
  if (multiplier >= 2) return t('duelStory.effectiveness.super', { factor })
  if (multiplier < 1) return t('duelStory.effectiveness.weak', { factor })
  return t('duelStory.effectiveness.normal', { factor })
}

export const describeKnockOut = (t: Translate, turns: number) =>
  turns === 1 ? t('duelStory.knockOutFirstHit') : t('duelStory.knockOutTurns', { turns })

export function describeAttack(
  t: Translate,
  locale: Locale,
  attackerName: string,
  defenderName: string,
  attack: AttackSummary,
) {
  const move = t('duelStory.attack', { attacker: attackerName, type: t(`types.${attack.type}`) })
  if (attack.turnsToKnockOut === Infinity) return t('duelStory.noEffect', { move, defender: defenderName })
  return t('duelStory.hit', {
    move,
    effectiveness: describeEffectiveness(t, attack.multiplier, locale),
    defender: defenderName,
    knockOut: describeKnockOut(t, attack.turnsToKnockOut),
  })
}

const otherSide = (side: DuelSide): DuelSide => (side === 'A' ? 'B' : 'A')

export function describeDuelTempo(
  t: Translate,
  fighters: Record<DuelSide, Fighter & { name: string }>,
  { attackOfA, attackOfB, firstStriker, winner }: DuelOutcome,
) {
  if (fighters.A.id === fighters.B.id) return t('duelStory.mirror')
  if (!winner) return t('duelStory.noHit')
  const first = fighters[firstStriker]
  const second = fighters[otherSide(firstStriker)]
  const opening =
    fighters.A.stats.speed === fighters.B.stats.speed
      ? t('duelStory.sameSpeed', { first: first.name })
      : t('duelStory.faster', { first: first.name })
  if (winner !== firstStriker) return t('duelStory.beatenFaster', { opening, second: second.name })
  return attackOfA.turnsToKnockOut === attackOfB.turnsToKnockOut
    ? t('duelStory.sameTurns', { opening })
    : t('duelStory.winsFaster', { opening, second: second.name })
}
