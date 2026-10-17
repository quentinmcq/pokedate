import type { DateInput, DateParts } from '../types/pokemon'
import { padNumber } from './pokemon'

export function pokemonIdFromDate({ d, m, y }: DateParts) {
  const n = (d % 10) * 100 + (m % 10) * 10 + (y % 10)
  return n === 0 ? 1000 : n
}

export function hashString(str: string) {
  let h = 2166136261
  for (const c of str) {
    h ^= c.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export const isShinyDate = ({ d, m, y }: DateParts) => hashString(`${d}-${m}-${y}`) % 20 === 0

export const secretIdForDate = ({ d, m, y }: DateParts) => (d === m ? 1001 + ((y * 31 + d) % 25) : null)

export function validateDateInput(v: DateInput): DateParts | { error: string } {
  const raw = { d: v.d.trim(), m: v.m.trim(), y: v.y.trim() }
  if (!raw.d || !raw.m || !raw.y) return { error: 'Il manque un morceau de la date.' }
  if (raw.y.length !== 4) return { error: "L'année s'écrit avec 4 chiffres (ex. 1995)." }
  const d = +raw.d,
    m = +raw.m,
    y = +raw.y
  if (!isRealDate({ d, m, y }))
    return { error: `Le ${padNumber(d)}/${padNumber(m)} n'existe pas… même chez les Pokémon 😅` }
  return { d, m, y }
}

export function isRealDate({ d, m, y }: DateParts) {
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y) || y < 1 || y > 9999) return false
  const dt = new Date(Date.UTC(2000, 0, 1))
  dt.setUTCFullYear(y, m - 1, d)
  return m >= 1 && m <= 12 && d >= 1 && dt.getUTCDate() === d && dt.getUTCMonth() === m - 1
}

export const toIsoDate = ({ d, m, y }: DateParts) => `${padNumber(y, 4)}-${padNumber(m)}-${padNumber(d)}`

export function parseIsoDate(s: unknown): DateParts | null {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(typeof s === 'string' ? s : '')
  if (!match) return null
  const date = { y: +match[1]!, m: +match[2]!, d: +match[3]! }
  return isRealDate(date) ? date : null
}

export const toDateInput = ({ d, m, y }: DateParts): DateInput => ({
  d: padNumber(d),
  m: padNumber(m),
  y: padNumber(y, 4),
})
export const emptyDateInput = (): DateInput => ({ d: '', m: '', y: '' })
