import { describe, expect, it } from 'vitest'
import {
  isValidCalendarDate,
  mirrorPokemonIdForDate,
  pokemonIdFromDate,
  todayInTimeZone,
} from '../../shared/utils/date'
import {
  dateDigitsForPokemon,
  daysEndingWith,
  exampleDatesForPokemon,
  monthsEndingWith,
  nextDateForPokemon,
} from '../../shared/utils/pokemonDates'

const FROM = { day: 17, month: 10, year: 2026 }

describe('dateDigitsForPokemon', () => {
  it('retrouve les chiffres du jour, du mois et de l’année', () => {
    expect(dateDigitsForPokemon(25)).toEqual({ day: 0, month: 2, year: 5 })
    expect(dateDigitsForPokemon(706)).toEqual({ day: 7, month: 0, year: 6 })
    expect(dateDigitsForPokemon(1000)).toEqual({ day: 0, month: 0, year: 0 })
  })

  it('ne donne rien pour les Pokémon des dates miroirs', () => {
    expect(dateDigitsForPokemon(1001)).toBeNull()
  })
})

describe('jours et mois possibles', () => {
  it('liste les jours et les mois qui finissent par un chiffre', () => {
    expect(daysEndingWith(0)).toEqual([10, 20, 30])
    expect(daysEndingWith(1)).toEqual([1, 11, 21, 31])
    expect(daysEndingWith(7)).toEqual([7, 17, 27])
    expect(monthsEndingWith(0)).toEqual([10])
    expect(monthsEndingWith(2)).toEqual([2, 12])
    expect(monthsEndingWith(5)).toEqual([5])
  })
})

describe('nextDateForPokemon', () => {
  it('trouve la prochaine date qui donne un Pokémon', () => {
    expect(nextDateForPokemon(25, FROM)).toEqual({ day: 10, month: 2, year: 2035 })
    expect(nextDateForPokemon(706, FROM)).toEqual({ day: 17, month: 10, year: 2026 })
    expect(nextDateForPokemon(1000, FROM)).toEqual({ day: 10, month: 10, year: 2030 })
  })

  it('trouve aussi la prochaine date miroir d’un Pokémon bonus', () => {
    const date = nextDateForPokemon(1001, FROM)
    expect(date && mirrorPokemonIdForDate(date)).toBe(1001)
  })
})

describe('exampleDatesForPokemon', () => {
  it('propose des dates de naissance qui donnent bien le Pokémon', () => {
    for (const id of [1, 25, 133, 706, 1000]) {
      const examples = exampleDatesForPokemon(id)
      expect(examples).toHaveLength(3)
      for (const date of examples) expect(pokemonIdFromDate(date)).toBe(id)
    }
    for (const date of exampleDatesForPokemon(1010)) expect(mirrorPokemonIdForDate(date)).toBe(1010)
  })
})

describe('les 1025 Pokémon', () => {
  it('ont tous une prochaine date et des exemples de dates valides', () => {
    for (let id = 1; id <= 1025; id++) {
      const givesPokemon = (date: { day: number; month: number; year: number }) =>
        id > 1000 ? mirrorPokemonIdForDate(date) === id : pokemonIdFromDate(date) === id
      const next = nextDateForPokemon(id, FROM)
      expect(next && givesPokemon(next), `prochaine date du n° ${id}`).toBe(true)
      for (const date of exampleDatesForPokemon(id)) {
        expect(isValidCalendarDate(date) && givesPokemon(date), `exemple du n° ${id}`).toBe(true)
      }
    }
  })
})

describe('todayInTimeZone', () => {
  it('donne la date du jour à Paris, même quand il est déjà demain là-bas', () => {
    expect(todayInTimeZone('Europe/Paris', new Date('2026-10-17T22:30:00Z'))).toEqual({
      day: 18,
      month: 10,
      year: 2026,
    })
  })
})
