import type { CalendarDate } from '../types/pokemon'
import { isValidCalendarDate, LAST_DATE_POKEMON_ID, mirrorPokemonIdForDate, pokemonIdFromDate } from './date'

export interface DateDigits {
  day: number
  month: number
  year: number
}

const MAX_DAY = 31
const MAX_MONTH = 12
const DAYS_SEARCHED = 366 * 30
const EXAMPLE_BIRTH_YEARS = { first: 1980, last: 2020 }

export const isMirrorOnlyPokemon = (id: number) => id > LAST_DATE_POKEMON_ID

export const dateDigitsForPokemon = (id: number): DateDigits | null =>
  id >= 1 && id <= LAST_DATE_POKEMON_ID
    ? { day: Math.floor(id / 100) % 10, month: Math.floor(id / 10) % 10, year: id % 10 }
    : null

const valuesEndingWith = (digit: number, max: number) =>
  [digit, digit + 10, digit + 20, digit + 30].filter((value) => value >= 1 && value <= max)

export const daysEndingWith = (digit: number) => valuesEndingWith(digit, MAX_DAY)
export const monthsEndingWith = (digit: number) => valuesEndingWith(digit, MAX_MONTH)

const dateGivesPokemon = (date: CalendarDate, id: number) =>
  isMirrorOnlyPokemon(id) ? mirrorPokemonIdForDate(date) === id : pokemonIdFromDate(date) === id

function followingDay({ day, month, year }: CalendarDate): CalendarDate {
  const date = new Date(Date.UTC(2000, 0, 1))
  date.setUTCFullYear(year, month - 1, day + 1)
  return { day: date.getUTCDate(), month: date.getUTCMonth() + 1, year: date.getUTCFullYear() }
}

export function nextDateForPokemon(id: number, from: CalendarDate): CalendarDate | null {
  let date = from
  for (let searched = 0; searched < DAYS_SEARCHED; searched++) {
    if (dateGivesPokemon(date, id)) return date
    date = followingDay(date)
  }
  return null
}

function datesInBirthYears(id: number) {
  const dates: CalendarDate[] = []
  for (let year = EXAMPLE_BIRTH_YEARS.first; year <= EXAMPLE_BIRTH_YEARS.last; year++) {
    const firstMatchOfYear = nextDateForPokemon(id, { day: 1, month: 1, year })
    if (firstMatchOfYear?.year === year) dates.push(firstMatchOfYear)
  }
  return dates
}

export function exampleDatesForPokemon(id: number, count = 3): CalendarDate[] {
  const digits = dateDigitsForPokemon(id)
  if (!digits) {
    const dates = datesInBirthYears(id)
    const step = Math.max(1, Math.floor(dates.length / count))
    return dates.filter((_, index) => index % step === 0).slice(-count)
  }
  const days = daysEndingWith(digits.day)
  const months = monthsEndingWith(digits.month)
  const years = Array.from(
    { length: EXAMPLE_BIRTH_YEARS.last - EXAMPLE_BIRTH_YEARS.first + 1 },
    (_, index) => EXAMPLE_BIRTH_YEARS.first + index,
  ).filter((year) => year % 10 === digits.year)
  return years.slice(-count).flatMap((year, index) => {
    const validDates = months
      .flatMap((month) => days.map((day) => ({ day, month, year })))
      .filter((date) => isValidCalendarDate(date))
    const date = validDates[(index * 2 + 1) % validDates.length]
    return date ? [date] : []
  })
}
