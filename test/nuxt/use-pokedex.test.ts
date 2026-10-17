import { beforeEach, describe, expect, it } from 'vitest'

describe('sanitizeDiscoveries', () => {
  it('garde les entrées valides', () => {
    expect(sanitizeDiscoveries({ 25: { shiny: false }, 133: { shiny: true } })).toEqual({
      25: { shiny: false },
      133: { shiny: true },
    })
  })

  it('relit l’ancien format { s: 0 | 1 }', () => {
    expect(sanitizeDiscoveries({ 25: { s: 0 }, 133: { s: 1 } })).toEqual({ 25: { shiny: false }, 133: { shiny: true } })
  })

  it('écarte tout ce qui ne ressemble pas à un Pokédex', () => {
    expect(sanitizeDiscoveries(null)).toEqual({})
    expect(sanitizeDiscoveries('texte')).toEqual({})
    expect(sanitizeDiscoveries([1, 2, 3])).toEqual({})
    expect(sanitizeDiscoveries({ 0: {}, 1026: {}, abc: {}, 1.5: {} })).toEqual({})
  })

  it('ramène les valeurs inattendues à « pas shiny »', () => {
    expect(sanitizeDiscoveries({ 25: null, 26: { shiny: 'oui' }, 27: 'x' })).toEqual({
      25: { shiny: false },
      26: { shiny: false },
      27: { shiny: false },
    })
  })

  it('ignore les clés spéciales comme __proto__', () => {
    const discoveries = sanitizeDiscoveries(JSON.parse('{"__proto__": {"shiny": true}, "25": {"shiny": true}}'))
    expect(discoveries).toEqual({ 25: { shiny: true } })
    expect(Object.getPrototypeOf(discoveries)).toBe(Object.prototype)
  })
})

describe('usePokedex', () => {
  beforeEach(() => {
    localStorage.clear()
    usePokedex().discoveries.value = {}
    useState('pokedex-loaded').value = false
  })

  it('enregistre une découverte et la signale comme nouvelle une seule fois', () => {
    const { recordDiscovery, discoveredCount } = usePokedex()
    expect(recordDiscovery(25)).toBe(true)
    expect(recordDiscovery(25)).toBe(false)
    expect(discoveredCount.value).toBe(1)
    expect(JSON.parse(localStorage.getItem('pokedate.dex')!)).toEqual({ 25: { shiny: false } })
  })

  it('retient qu’un Pokémon a été vu en shiny', () => {
    const { recordDiscovery, discoveries, shinyCount } = usePokedex()
    recordDiscovery(133, { shiny: true })
    recordDiscovery(133)
    expect(discoveries.value[133]).toEqual({ shiny: true })
    expect(shinyCount.value).toBe(1)
  })

  it('recharge le Pokédex sauvegardé', () => {
    localStorage.setItem('pokedate.dex', JSON.stringify({ 1: { shiny: false }, 4: { s: 1 } }))
    const { loadDiscoveries, discoveredCount, shinyCount } = usePokedex()
    loadDiscoveries()
    expect(discoveredCount.value).toBe(2)
    expect(shinyCount.value).toBe(1)
  })

  it('survit à un localStorage corrompu', () => {
    localStorage.setItem('pokedate.dex', '{pas du json')
    const { recordDiscovery, discoveredCount } = usePokedex()
    expect(() => recordDiscovery(7)).not.toThrow()
    expect(discoveredCount.value).toBe(1)
  })
})
