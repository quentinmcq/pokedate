import type { PokemonDetail, TypeKey } from '../types/pokemon'
import { formatNumber, POKEMON_TYPES, statTotal, typeEffectiveness } from './pokemon'

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
  const factor = `(×${formatNumber(multiplier, 2)})`
  if (multiplier >= 4) return `c'est ultra efficace ${factor} !`
  if (multiplier >= 2) return `c'est super efficace ${factor} !`
  if (multiplier < 1) return `ce n'est pas très efficace ${factor}…`
  return `efficacité normale ${factor}.`
}

export const describeKnockOut = (turns: number) =>
  turns === 1 ? 'tombe K.O. dès le premier coup' : `tombe K.O. en ${turns} coups`

export function describeAttack(attackerName: string, defenderName: string, attack: AttackSummary) {
  const move = `${attackerName} lance une attaque ${POKEMON_TYPES[attack.type].label}`
  if (attack.turnsToKnockOut === Infinity) return `${move}, mais elle n'a aucun effet sur ${defenderName}.`
  return `${move} : ${describeEffectiveness(attack.multiplier)} ${defenderName} ${describeKnockOut(attack.turnsToKnockOut)}.`
}

const otherSide = (side: DuelSide): DuelSide => (side === 'A' ? 'B' : 'A')

export function describeDuelTempo(
  fighters: Record<DuelSide, Fighter & { name: string }>,
  { attackOfA, attackOfB, firstStriker, winner }: DuelOutcome,
) {
  if (fighters.A.id === fighters.B.id) return 'Même Pokémon, mêmes stats : impossible de les départager.'
  if (!winner) return "Aucun des deux ne peut toucher l'autre."
  const first = fighters[firstStriker]
  const second = fighters[otherSide(firstStriker)]
  const opening =
    fighters.A.stats.speed === fighters.B.stats.speed
      ? `Vitesse égale : ${first.name}, plus costaud, frappe en premier`
      : `${first.name} est plus rapide et frappe en premier`
  if (winner !== firstStriker) return `${opening}, mais ${second.name} le met K.O. plus vite.`
  return attackOfA.turnsToKnockOut === attackOfB.turnsToKnockOut
    ? `${opening} : à nombre de coups égal, ça fait la différence.`
    : `${opening} et met ${second.name} K.O. plus vite.`
}
