import type { Message } from './messages'
import type { CalendarDate, DateFieldValue } from '../types/pokemon'
import { padNumber } from './pokemon'

const lastDigit = (value: number) => value % 10

export const LAST_DATE_POKEMON_ID = 1000

export function pokemonIdFromDate({ day, month, year }: CalendarDate) {
  const id = lastDigit(day) * 100 + lastDigit(month) * 10 + lastDigit(year)
  return id === 0 ? LAST_DATE_POKEMON_ID : id
}

function fnv1aHash(text: string) {
  let hash = 2166136261
  for (const character of text) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const SHINY_ODDS = 20

export const isShinyDate = ({ day, month, year }: CalendarDate) =>
  fnv1aHash(`${day}-${month}-${year}`) % SHINY_ODDS === 0

const FIRST_MIRROR_POKEMON_ID = 1001
const MIRROR_POKEMON_COUNT = 25

export const isMirrorDate = ({ day, month }: CalendarDate) => day === month

export const mirrorPokemonIdForDate = (date: CalendarDate) =>
  isMirrorDate(date) ? FIRST_MIRROR_POKEMON_ID + ((date.year * 31 + date.day) % MIRROR_POKEMON_COUNT) : null

export function isValidCalendarDate({ day, month, year }: CalendarDate) {
  if (![day, month, year].every(Number.isInteger) || year < 1 || year > 9999) return false
  const probe = new Date(Date.UTC(2000, 0, 1))
  probe.setUTCFullYear(year, month - 1, day)
  return month >= 1 && month <= 12 && day >= 1 && probe.getUTCDate() === day && probe.getUTCMonth() === month - 1
}

export type DateFieldKey = keyof DateFieldValue

export type DateParseResult =
  | { ok: true; date: CalendarDate }
  | { ok: false; error: Message; invalidPart: DateFieldKey }

const MONTHS_IN_YEAR = 12
const MAX_DAYS_IN_MONTH = 31

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

const invalid = (invalidPart: DateFieldKey, key: string, params?: Message['params']): DateParseResult => ({
  ok: false,
  error: { key: `dateErrors.${key}`, ...(params ? { params } : {}) },
  invalidPart,
})

export function parseDateFieldValue(value: DateFieldValue): DateParseResult {
  const parts = { day: value.day.trim(), month: value.month.trim(), year: value.year.trim() }
  const missingPart = (['day', 'month', 'year'] as const).find((part) => !parts[part])
  if (missingPart) return invalid(missingPart, `missing.${missingPart}`)
  if (parts.year.length !== 4) return invalid('year', 'yearDigits')

  const date = { day: Number(parts.day), month: Number(parts.month), year: Number(parts.year) }
  if (date.year < 1) return invalid('year', 'yearZero')
  if (date.month < 1 || date.month > MONTHS_IN_YEAR) return invalid('month', 'month', { month: padNumber(date.month) })
  if (date.day < 1 || date.day > MAX_DAYS_IN_MONTH) return invalid('day', 'day', { day: padNumber(date.day) })
  if (date.day === 29 && date.month === 2 && !isLeapYear(date.year))
    return invalid('day', 'notLeapYear', { year: date.year })
  if (!isValidCalendarDate(date))
    return invalid('day', 'impossible', { day: padNumber(date.day), month: padNumber(date.month) })
  return { ok: true, date }
}

export const toIsoDate = ({ day, month, year }: CalendarDate) =>
  `${padNumber(year, 4)}-${padNumber(month)}-${padNumber(day)}`

export function parseIsoDate(value: unknown): CalendarDate | null {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(typeof value === 'string' ? value : '')
  if (!match) return null
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  return isValidCalendarDate(date) ? date : null
}

export const toDateFieldValue = ({ day, month, year }: CalendarDate): DateFieldValue => ({
  day: padNumber(day),
  month: padNumber(month),
  year: padNumber(year, 4),
})

export const emptyDateFieldValue = (): DateFieldValue => ({ day: '', month: '', year: '' })

export function todayInTimeZone(timeZone: string, now = new Date()): CalendarDate {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' })
    .formatToParts(now)
    .reduce<Record<string, number>>((values, part) => ({ ...values, [part.type]: Number(part.value) }), {})
  return { day: parts.day ?? 1, month: parts.month ?? 1, year: parts.year ?? 1970 }
}

export const todayAsCalendarDate = (now = new Date()): CalendarDate => ({
  day: now.getDate(),
  month: now.getMonth() + 1,
  year: now.getFullYear(),
})

const FRENCH_DATE_PATTERN = /^\s*(\d{1,2})\D(\d{1,2})\D(\d{4})\s*$/
const ISO_DATE_PATTERN = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})\s*$/

export function parsePastedDate(text: string): DateFieldValue | null {
  const french = FRENCH_DATE_PATTERN.exec(text)
  const iso = ISO_DATE_PATTERN.exec(text)
  const [day, month, year] = french ? [french[1], french[2], french[3]] : iso ? [iso[3], iso[2], iso[1]] : []
  if (!day || !month || !year) return null
  return { day: day.padStart(2, '0'), month: month.padStart(2, '0'), year }
}
