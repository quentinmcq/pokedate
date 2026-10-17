import { beforeEach, describe, expect, it } from 'vitest'

describe('sanitizeDex', () => {
  it('garde les entrées valides', () => {
    expect(sanitizeDex({ 25: { s: 0 }, 133: { s: 1 } })).toEqual({ 25: { s: 0 }, 133: { s: 1 } })
  })

  it('écarte tout ce qui ne ressemble pas à un Pokédex', () => {
    expect(sanitizeDex(null)).toEqual({})
    expect(sanitizeDex('texte')).toEqual({})
    expect(sanitizeDex([1, 2, 3])).toEqual({})
    expect(sanitizeDex({ 0: { s: 1 }, 1026: { s: 1 }, abc: { s: 1 }, 1.5: { s: 1 } })).toEqual({})
  })

  it('ramène les valeurs inattendues à « pas shiny »', () => {
    expect(sanitizeDex({ 25: null, 26: { s: 'oui' }, 27: 'x' })).toEqual({ 25: { s: 0 }, 26: { s: 0 }, 27: { s: 0 } })
  })

  it('ignore les clés spéciales comme __proto__', () => {
    const out = sanitizeDex(JSON.parse('{"__proto__": {"s": 1}, "25": {"s": 1}}'))
    expect(out).toEqual({ 25: { s: 1 } })
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype)
  })
})

describe('useDex', () => {
  beforeEach(() => {
    localStorage.clear()
    const { dex } = useDex()
    dex.value = {}
    useState('dex-loaded').value = false
  })

  it('enregistre une découverte et la signale comme nouvelle une seule fois', () => {
    const { catchPokemon, count } = useDex()
    expect(catchPokemon(25)).toBe(true)
    expect(catchPokemon(25)).toBe(false)
    expect(count.value).toBe(1)
    expect(JSON.parse(localStorage.getItem('pokedate.dex')!)).toEqual({ 25: { s: 0 } })
  })

  it('retient qu’un Pokémon a été vu en shiny', () => {
    const { catchPokemon, dex, shinyCount } = useDex()
    catchPokemon(133, true)
    catchPokemon(133, false)
    expect(dex.value[133]).toEqual({ s: 1 })
    expect(shinyCount.value).toBe(1)
  })

  it('recharge le Pokédex sauvegardé', () => {
    localStorage.setItem('pokedate.dex', JSON.stringify({ 1: { s: 0 }, 4: { s: 1 } }))
    const { ensureLoaded, count } = useDex()
    ensureLoaded()
    expect(count.value).toBe(2)
  })

  it('survit à un localStorage corrompu', () => {
    localStorage.setItem('pokedate.dex', '{pas du json')
    const { catchPokemon, count } = useDex()
    expect(() => catchPokemon(7)).not.toThrow()
    expect(count.value).toBe(1)
  })
})
