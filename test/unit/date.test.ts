import { describe, expect, it } from 'vitest'
import {
  isShinyDate,
  isValidCalendarDate,
  mirrorPokemonIdForDate,
  parseDateFieldValue,
  parseIsoDate,
  parsePastedDate,
  pokemonIdFromDate,
  toDateFieldValue,
  toIsoDate,
} from '../../shared/utils/date'

describe('pokemonIdFromDate', () => {
  it('assemble le dernier chiffre du jour, du mois et de l’année', () => {
    expect(pokemonIdFromDate({ day: 17, month: 10, year: 2026 })).toBe(706)
    expect(pokemonIdFromDate({ day: 1, month: 1, year: 2001 })).toBe(111)
    expect(pokemonIdFromDate({ day: 25, month: 12, year: 1999 })).toBe(529)
  })

  it('donne le n° 1000 quand les trois chiffres sont 0', () => {
    expect(pokemonIdFromDate({ day: 10, month: 10, year: 2020 })).toBe(1000)
    expect(pokemonIdFromDate({ day: 30, month: 10, year: 1990 })).toBe(1000)
  })

  it('reste toujours entre 1 et 1000', () => {
    for (let day = 1; day <= 31; day++)
      for (let month = 1; month <= 12; month++)
        for (let year = 1990; year < 2000; year++) {
          const id = pokemonIdFromDate({ day, month, year })
          expect(id).toBeGreaterThanOrEqual(1)
          expect(id).toBeLessThanOrEqual(1000)
        }
  })
})

describe('isShinyDate', () => {
  it('donne toujours le même résultat pour une même date', () => {
    const date = { day: 6, month: 4, year: 1990 }
    expect(isShinyDate(date)).toBe(isShinyDate({ ...date }))
  })

  it('touche environ une date sur vingt', () => {
    let shinyCount = 0
    let dateCount = 0
    for (let year = 1980; year < 2020; year++)
      for (let month = 1; month <= 12; month++)
        for (let day = 1; day <= 28; day++) {
          dateCount++
          if (isShinyDate({ day, month, year })) shinyCount++
        }
    expect(shinyCount / dateCount).toBeGreaterThan(0.035)
    expect(shinyCount / dateCount).toBeLessThan(0.065)
  })
})

describe('mirrorPokemonIdForDate', () => {
  it('ne se déclenche que si le jour et le mois sont identiques', () => {
    expect(mirrorPokemonIdForDate({ day: 4, month: 5, year: 1990 })).toBeNull()
    expect(mirrorPokemonIdForDate({ day: 4, month: 4, year: 1990 })).not.toBeNull()
  })

  it('renvoie un Pokémon entre 1001 et 1025', () => {
    for (let year = 1900; year < 2100; year++)
      for (let day = 1; day <= 12; day++) {
        const id = mirrorPokemonIdForDate({ day, month: day, year })
        expect(id).toBeGreaterThanOrEqual(1001)
        expect(id).toBeLessThanOrEqual(1025)
      }
  })
})

describe('parseDateFieldValue', () => {
  it('accepte une date valide', () => {
    expect(parseDateFieldValue({ day: '17', month: '10', year: '2026' })).toEqual({
      ok: true,
      date: { day: 17, month: 10, year: 2026 },
    })
    expect(parseDateFieldValue({ day: ' 1', month: '2 ', year: '2024' })).toMatchObject({ ok: true })
  })

  it('refuse une date incomplète', () => {
    expect(parseDateFieldValue({ day: '', month: '10', year: '2026' })).toMatchObject({ ok: false })
  })

  it('exige une année à 4 chiffres', () => {
    expect(parseDateFieldValue({ day: '17', month: '10', year: '26' })).toEqual({
      ok: false,
      error: expect.stringContaining('4 chiffres'),
    })
  })

  it('refuse les jours qui n’existent pas', () => {
    expect(parseDateFieldValue({ day: '31', month: '02', year: '2026' })).toEqual({
      ok: false,
      error: expect.stringContaining("n'existe pas"),
    })
    expect(parseDateFieldValue({ day: '29', month: '02', year: '2023' })).toMatchObject({ ok: false })
    expect(parseDateFieldValue({ day: '29', month: '02', year: '2024' })).toMatchObject({ ok: true })
    expect(parseDateFieldValue({ day: '12', month: '13', year: '2024' })).toMatchObject({ ok: false })
  })
})

describe('isValidCalendarDate', () => {
  it('gère les années anciennes sans décalage', () => {
    expect(isValidCalendarDate({ day: 1, month: 1, year: 50 })).toBe(true)
    expect(isValidCalendarDate({ day: 1, month: 1, year: 0 })).toBe(false)
    expect(isValidCalendarDate({ day: 1.5, month: 1, year: 2000 })).toBe(false)
  })
})

describe('dates dans l’URL', () => {
  it('lit le format ISO', () => {
    expect(parseIsoDate('1995-03-12')).toEqual({ year: 1995, month: 3, day: 12 })
    expect(parseIsoDate('1995-3-2')).toEqual({ year: 1995, month: 3, day: 2 })
  })

  it('ignore tout ce qui n’est pas une vraie date', () => {
    for (const invalid of ['', '1995-02-30', '12/03/1995', '1995-03-12<script>', ['1995-03-12'], 42, null, undefined])
      expect(parseIsoDate(invalid)).toBeNull()
  })

  it('écrit des dates complétées par des zéros', () => {
    expect(toIsoDate({ day: 2, month: 3, year: 995 })).toBe('0995-03-02')
    expect(toDateFieldValue({ day: 2, month: 3, year: 1995 })).toEqual({ day: '02', month: '03', year: '1995' })
  })
})

describe('parsePastedDate', () => {
  it('comprend les formats français et ISO', () => {
    expect(parsePastedDate('7/3/1995')).toEqual({ day: '07', month: '03', year: '1995' })
    expect(parsePastedDate(' 17.10.2026 ')).toEqual({ day: '17', month: '10', year: '2026' })
    expect(parsePastedDate('2026-10-17')).toEqual({ day: '17', month: '10', year: '2026' })
  })

  it('ignore le reste', () => {
    expect(parsePastedDate('hier')).toBeNull()
    expect(parsePastedDate('17/10/26')).toBeNull()
  })
})
