import { describe, expect, it } from 'vitest'

describe('parseDuelQuery', () => {
  it('lit les Pokémon, le shiny et les prénoms', () => {
    expect(parseDuelQuery({ pa: '235', pb: '578', sa: '1', na: 'Quentin', nb: 'Léa' })).toEqual({
      pokemonIdA: 235,
      pokemonIdB: 578,
      shinyA: true,
      shinyB: false,
      playerNameA: 'Quentin',
      playerNameB: 'Léa',
    })
  })

  it('ignore les numéros invalides', () => {
    for (const invalid of ['0', '1026', '-3', '1.5', 'abc', ''])
      expect(parseDuelQuery({ pa: invalid }).pokemonIdA).toBeNull()
  })

  it('tronque les prénoms trop longs', () => {
    expect(parseDuelQuery({ na: 'A'.repeat(200) }).playerNameA).toHaveLength(PLAYER_NAME_MAX_LENGTH)
  })

  it('ignore les paramètres répétés', () => {
    expect(parseDuelQuery({ na: ['Quentin', 'Léa'] }).playerNameA).toBe('')
  })
})

describe('buildDuelQuery', () => {
  it('écrit une URL courte sans les valeurs vides', () => {
    expect(
      buildDuelQuery({
        pokemonIdA: 1,
        pokemonIdB: 4,
        shinyA: false,
        shinyB: true,
        playerNameA: '  Quentin ',
        playerNameB: '',
      }),
    ).toEqual({ pa: '1', pb: '4', sb: '1', na: 'Quentin' })
  })

  it('relit ce qu’il écrit', () => {
    const duel = { pokemonIdA: 25, pokemonIdB: 133, shinyA: true, shinyB: false, playerNameA: 'A', playerNameB: 'B' }
    expect(parseDuelQuery(buildDuelQuery(duel))).toEqual(duel)
  })
})
