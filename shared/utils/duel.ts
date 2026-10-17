import type { Pokemon, TypeKey } from '../types/pokemon'
import { typeEffect } from './pokemon'

type Fighter = Pick<Pokemon, 'id' | 'types' | 'stats'>

export interface Attack {
  type: TypeKey
  mult: number
  dmg: number
  turns: number
}

export function attack(a: Fighter, b: Fighter): Attack {
  const phys = a.stats[1]! >= a.stats[3]!
  const A = (phys ? a.stats[1]! : a.stats[3]!) + 5
  const D = (phys ? b.stats[2]! : b.stats[4]!) + 5
  const [type, mult] = a.types.map((t) => [t, typeEffect(t, b.types)] as const).toSorted((x, y) => y[1] - x[1])[0]!
  const dmg = Math.floor(((35.2 * A) / D + 2) * 1.5 * mult)
  const turns = dmg ? Math.ceil((b.stats[0]! + 60) / dmg) : Infinity
  return { type, mult, dmg, turns }
}

const total = (p: Fighter) => p.stats.reduce((x, y) => x + y, 0)

export interface DuelResult {
  ab: Attack
  ba: Attack
  aFirst: boolean
  winner: 'A' | 'B' | null
}

export function duel(a: Fighter, b: Fighter): DuelResult {
  const ab = attack(a, b)
  const ba = attack(b, a)
  const aFirst = a.stats[5]! > b.stats[5]! || (a.stats[5] === b.stats[5] && total(a) >= total(b))
  let winner: DuelResult['winner'] = null
  if (a.id === b.id || (ab.turns === Infinity && ba.turns === Infinity)) winner = null
  else if (aFirst) winner = ab.turns <= ba.turns ? 'A' : 'B'
  else winner = ba.turns <= ab.turns ? 'B' : 'A'
  return { ab, ba, aFirst, winner }
}

export const effectText = (m: number) =>
  m === 0
    ? "n'a aucun effet 🚫"
    : m >= 4
      ? 'est ultra efficace 💥'
      : m >= 2
        ? 'est super efficace 💥'
        : m < 1
          ? "n'est pas très efficace…"
          : 'touche normalement'

export const statTotal = total
