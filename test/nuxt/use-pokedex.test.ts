import { beforeEach, describe, expect, it } from 'vitest'

describe('sanitizeDiscoveries', () => {
  it('garde les entrées valides', () => {
    expect(
      sanitizeDiscoveries({
        25: { caught: true, shiny: false },
        133: { caught: true, shiny: true },
        7: { caught: false },
      }),
    ).toEqual({
      25: { caught: true, shiny: false },
      133: { caught: true, shiny: true },
      7: { caught: false, shiny: false },
    })
  })

  it('considère comme attrapés les Pokémon des anciens Pokédex', () => {
    expect(sanitizeDiscoveries({ 25: { shiny: false }, 133: { s: 1 } })).toEqual({
      25: { caught: true, shiny: false },
      133: { caught: true, shiny: true },
    })
  })

  it('écarte tout ce qui ne ressemble pas à un Pokédex', () => {
    expect(sanitizeDiscoveries(null)).toEqual({})
    expect(sanitizeDiscoveries('texte')).toEqual({})
    expect(sanitizeDiscoveries([1, 2, 3])).toEqual({})
    expect(sanitizeDiscoveries({ 0: {}, 1026: {}, abc: {}, 1.5: {} })).toEqual({})
  })

  it('ramène les valeurs inattendues à « attrapé, pas shiny »', () => {
    expect(sanitizeDiscoveries({ 25: null, 26: { shiny: 'oui' }, 27: 'x' })).toEqual({
      25: { caught: true, shiny: false },
      26: { caught: true, shiny: false },
      27: { caught: true, shiny: false },
    })
  })

  it('ne garde pas de shiny sur un Pokémon seulement vu', () => {
    expect(sanitizeDiscoveries({ 25: { caught: false, shiny: true } })).toEqual({ 25: { caught: false, shiny: false } })
  })

  it('ignore les clés spéciales comme __proto__', () => {
    const discoveries = sanitizeDiscoveries(JSON.parse('{"__proto__": {"shiny": true}, "25": {"shiny": true}}'))
    expect(discoveries).toEqual({ 25: { caught: true, shiny: true } })
    expect(Object.getPrototypeOf(discoveries)).toBe(Object.prototype)
  })
})

describe('usePokedex', () => {
  beforeEach(() => {
    localStorage.clear()
    usePokedex().discoveries.value = {}
    useState('pokedex-loaded').value = false
  })

  it('attrape un Pokémon et le signale comme nouveau une seule fois', () => {
    const { recordDiscovery, caughtCount } = usePokedex()
    expect(recordDiscovery(25, { caught: true })).toBe(true)
    expect(recordDiscovery(25, { caught: true })).toBe(false)
    expect(caughtCount.value).toBe(1)
    expect(JSON.parse(localStorage.getItem('pokedate.dex')!)).toEqual({ 25: { caught: true, shiny: false } })
  })

  it('distingue un Pokémon vu d’un Pokémon attrapé', () => {
    const { recordDiscovery, seenCount, caughtCount, discoveryStateOf } = usePokedex()
    expect(recordDiscovery(133)).toBe(true)
    expect(discoveryStateOf(133)).toBe('seen')
    expect(recordDiscovery(133, { caught: true })).toBe(true)
    expect(recordDiscovery(133)).toBe(false)
    expect(discoveryStateOf(133)).toBe('caught')
    expect(discoveryStateOf(1)).toBe('unknown')
    expect([seenCount.value, caughtCount.value]).toEqual([1, 1])
  })

  it('ne compte un shiny que s’il est attrapé', () => {
    const { recordDiscovery, discoveries, shinyCount } = usePokedex()
    recordDiscovery(25, { shiny: true })
    expect(shinyCount.value).toBe(0)
    recordDiscovery(133, { caught: true, shiny: true })
    recordDiscovery(133, { caught: true })
    expect(discoveries.value[133]).toEqual({ caught: true, shiny: true })
    expect(shinyCount.value).toBe(1)
  })

  it('recharge le Pokédex sauvegardé', () => {
    localStorage.setItem('pokedate.dex', JSON.stringify({ 1: { shiny: false }, 4: { s: 1 }, 7: { caught: false } }))
    const { loadDiscoveries, seenCount, caughtCount, shinyCount } = usePokedex()
    loadDiscoveries()
    expect([seenCount.value, caughtCount.value, shinyCount.value]).toEqual([3, 2, 1])
  })

  it('survit à un localStorage corrompu', () => {
    localStorage.setItem('pokedate.dex', '{pas du json')
    const { recordDiscovery, caughtCount } = usePokedex()
    expect(() => recordDiscovery(7, { caught: true })).not.toThrow()
    expect(caughtCount.value).toBe(1)
  })
})
