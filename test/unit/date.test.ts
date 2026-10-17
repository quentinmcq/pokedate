import { describe, expect, it } from 'vitest'
import {
  isRealDate,
  isShinyDate,
  parseIsoDate,
  pokemonIdFromDate,
  secretIdForDate,
  toDateInput,
  toIsoDate,
  validateDateInput,
} from '../../shared/utils/date'

describe('pokemonIdFromDate', () => {
  it('assemble le dernier chiffre du jour, du mois et de l’année', () => {
    expect(pokemonIdFromDate({ d: 17, m: 10, y: 2026 })).toBe(706)
    expect(pokemonIdFromDate({ d: 1, m: 1, y: 2001 })).toBe(111)
    expect(pokemonIdFromDate({ d: 25, m: 12, y: 1999 })).toBe(529)
  })

  it('donne le n° 1000 quand les trois chiffres sont 0', () => {
    expect(pokemonIdFromDate({ d: 10, m: 10, y: 2020 })).toBe(1000)
    expect(pokemonIdFromDate({ d: 30, m: 10, y: 1990 })).toBe(1000)
  })

  it('reste toujours entre 1 et 1000', () => {
    for (let d = 1; d <= 31; d++)
      for (let m = 1; m <= 12; m++)
        for (let y = 1990; y < 2000; y++) {
          const id = pokemonIdFromDate({ d, m, y })
          expect(id).toBeGreaterThanOrEqual(1)
          expect(id).toBeLessThanOrEqual(1000)
        }
  })
})

describe('isShinyDate', () => {
  it('donne toujours le même résultat pour une même date', () => {
    const date = { d: 6, m: 4, y: 1990 }
    expect(isShinyDate(date)).toBe(isShinyDate({ ...date }))
  })

  it('touche environ une date sur vingt', () => {
    let shiny = 0
    let total = 0
    for (let y = 1980; y < 2020; y++)
      for (let m = 1; m <= 12; m++)
        for (let d = 1; d <= 28; d++) {
          total++
          if (isShinyDate({ d, m, y })) shiny++
        }
    const rate = shiny / total
    expect(rate).toBeGreaterThan(0.035)
    expect(rate).toBeLessThan(0.065)
  })
})

describe('secretIdForDate', () => {
  it('ne se déclenche que si le jour et le mois sont identiques', () => {
    expect(secretIdForDate({ d: 4, m: 5, y: 1990 })).toBeNull()
    expect(secretIdForDate({ d: 4, m: 4, y: 1990 })).not.toBeNull()
  })

  it('renvoie un Pokémon entre 1001 et 1025', () => {
    for (let y = 1900; y < 2100; y++)
      for (let d = 1; d <= 12; d++) {
        const id = secretIdForDate({ d, m: d, y })!
        expect(id).toBeGreaterThanOrEqual(1001)
        expect(id).toBeLessThanOrEqual(1025)
      }
  })
})

describe('validateDateInput', () => {
  it('accepte une date valide', () => {
    expect(validateDateInput({ d: '17', m: '10', y: '2026' })).toEqual({ d: 17, m: 10, y: 2026 })
    expect(validateDateInput({ d: ' 1', m: '2 ', y: '2024' })).toEqual({ d: 1, m: 2, y: 2024 })
  })

  it('refuse une date incomplète', () => {
    expect(validateDateInput({ d: '', m: '10', y: '2026' })).toHaveProperty('error')
  })

  it('exige une année à 4 chiffres', () => {
    expect(validateDateInput({ d: '17', m: '10', y: '26' })).toEqual({ error: expect.stringContaining('4 chiffres') })
  })

  it('refuse les jours qui n’existent pas', () => {
    expect(validateDateInput({ d: '31', m: '02', y: '2026' })).toEqual({
      error: expect.stringContaining("n'existe pas"),
    })
    expect(validateDateInput({ d: '29', m: '02', y: '2023' })).toHaveProperty('error')
    expect(validateDateInput({ d: '29', m: '02', y: '2024' })).toEqual({ d: 29, m: 2, y: 2024 })
    expect(validateDateInput({ d: '12', m: '13', y: '2024' })).toHaveProperty('error')
  })
})

describe('isRealDate', () => {
  it('gère les années anciennes sans décalage', () => {
    expect(isRealDate({ d: 1, m: 1, y: 50 })).toBe(true)
    expect(isRealDate({ d: 1, m: 1, y: 0 })).toBe(false)
    expect(isRealDate({ d: 1.5, m: 1, y: 2000 })).toBe(false)
  })
})

describe('dates dans l’URL', () => {
  it('lit le format ISO', () => {
    expect(parseIsoDate('1995-03-12')).toEqual({ y: 1995, m: 3, d: 12 })
    expect(parseIsoDate('1995-3-2')).toEqual({ y: 1995, m: 3, d: 2 })
  })

  it('ignore tout ce qui n’est pas une vraie date', () => {
    for (const bad of ['', '1995-02-30', '12/03/1995', '1995-03-12<script>', ['1995-03-12'], 42, null, undefined])
      expect(parseIsoDate(bad)).toBeNull()
  })

  it('écrit des dates complétées par des zéros', () => {
    expect(toIsoDate({ d: 2, m: 3, y: 995 })).toBe('0995-03-02')
    expect(toDateInput({ d: 2, m: 3, y: 1995 })).toEqual({ d: '02', m: '03', y: '1995' })
  })
})
