import { describe, expect, it } from 'vitest'

describe('transfert du Pokédex', () => {
  it('encode et décode un Pokédex sans rien perdre', () => {
    const discoveries = {
      1: { caught: true, shiny: false },
      25: { caught: true, shiny: true },
      133: { caught: false, shiny: false },
      1025: { caught: true, shiny: false },
    }
    const code = encodeDiscoveries(discoveries)
    expect(code).toMatch(/^1\.[\w-]+$/)
    expect(decodeDiscoveries(code)).toEqual(discoveries)
  })

  it('reste court, même pour un Pokédex complet', () => {
    const complete = Object.fromEntries(
      Array.from({ length: POKEMON_COUNT }, (_, index) => [index + 1, { caught: true, shiny: true }]),
    )
    expect(encodeDiscoveries(complete).length).toBeLessThan(360)
    expect(Object.keys(decodeDiscoveries(encodeDiscoveries(complete))!)).toHaveLength(POKEMON_COUNT)
  })

  it('transfère aussi les shiny vus au hasard', () => {
    const discoveries = {
      25: { caught: false, shiny: false, seenShiny: true as const },
      1007: { caught: false, shiny: false, seenShiny: true as const },
      4: { caught: true, shiny: false },
    }
    const code = encodeDiscoveries(discoveries)
    expect(code).toMatch(/^1\.[\w-]+\.[0-9a-z-]+$/)
    expect(decodeDiscoveries(code)).toEqual(discoveries)
  })

  it('encode un Pokédex vide', () => {
    expect(decodeDiscoveries(encodeDiscoveries({}))).toEqual({})
  })

  it('refuse un code abîmé ou d’une autre version', () => {
    expect(decodeDiscoveries('2.AAAA')).toBeNull()
    expect(decodeDiscoveries('1.<script>')).toBeNull()
    expect(decodeDiscoveries('nimportequoi')).toBeNull()
  })

  it('ignore ce qui dépasse le dernier Pokémon', () => {
    const decoded = decodeDiscoveries(`1.${'_'.repeat(400)}`)!
    expect(Math.max(...Object.keys(decoded).map(Number))).toBe(POKEMON_COUNT)
  })
})
