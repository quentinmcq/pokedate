import { describe, expect, it } from 'vitest'

describe('parseTournamentQuery', () => {
  it('lit les joueurs, leurs Pokémon et leurs prénoms', () => {
    expect(parseTournamentQuery({ p: ['25', '133', '706'], s: ['0', '1', '0'], n: ['Quentin', 'Léa', ''] })).toEqual([
      { pokemonId: 25, shiny: false, name: 'Quentin' },
      { pokemonId: 133, shiny: true, name: 'Léa' },
      { pokemonId: 706, shiny: false, name: '' },
    ])
  })

  it('refuse un tournoi à moins de 3 ou plus de 8 joueurs', () => {
    expect(parseTournamentQuery({ p: ['25', '133'] })).toBeNull()
    expect(parseTournamentQuery({ p: Array.from({ length: 9 }, () => '25') })).toBeNull()
  })

  it('refuse un numéro de Pokémon invalide', () => {
    expect(parseTournamentQuery({ p: ['25', '0', '706'] })).toBeNull()
    expect(parseTournamentQuery({ p: ['25', 'abc', '706'] })).toBeNull()
  })

  it('tronque les prénoms trop longs', () => {
    expect(parseTournamentQuery({ p: ['1', '2', '3'], n: ['A'.repeat(50)] })![0]!.name).toBe('A'.repeat(20))
  })

  it('relit ce qu’il a écrit', () => {
    const players = [
      { pokemonId: 1, shiny: false, name: 'Max' },
      { pokemonId: 4, shiny: true, name: 'Zoé' },
      { pokemonId: 7, shiny: false, name: '' },
    ]
    expect(parseTournamentQuery(buildTournamentQuery(players))).toEqual(players)
  })
})
