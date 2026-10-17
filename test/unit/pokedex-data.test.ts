import { describe, expect, it } from 'vitest'
import { findPokemon, getDexList } from '../../server/utils/pokedex'
import { MAX_POKEMON, slugify } from '../../shared/utils/pokemon'

describe('données des Pokémon', () => {
  it('contient les 1025 Pokémon dans l’ordre', () => {
    const list = getDexList()
    expect(list).toHaveLength(MAX_POKEMON)
    list.forEach((p, i) => expect(p.id).toBe(i + 1))
  })

  it('donne à chaque Pokémon un nom, des types et 6 statistiques', () => {
    for (let id = 1; id <= MAX_POKEMON; id++) {
      const p = findPokemon(id)!
      expect(p.fr.length).toBeGreaterThan(0)
      expect(p.types.length).toBeGreaterThanOrEqual(1)
      expect(p.stats).toHaveLength(6)
      expect(p.chain.flat().some((e) => e.id === id)).toBe(true)
    }
  })

  it('a des adresses uniques pour toutes les fiches', () => {
    const slugs = getDexList().map((p) => slugify(p.fr))
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(slugs.every((s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s))).toBe(true)
  })

  it('renvoie la fiche complète avec ses voisins', () => {
    const p = findPokemon(706)!
    expect(p).toMatchObject({ id: 706, fr: 'Muplodocus', types: ['dragon'] })
    expect(p.prev).toEqual({ id: 705, fr: expect.any(String) })
    expect(p.next).toEqual({ id: 707, fr: expect.any(String) })
    expect(p.chain).toHaveLength(3)
  })

  it('n’a pas de voisin avant le n° 1 ni après le dernier', () => {
    expect(findPokemon(1)!.prev).toBeNull()
    expect(findPokemon(MAX_POKEMON)!.next).toBeNull()
  })

  it('ne renvoie rien pour un numéro inexistant', () => {
    for (const id of [0, -1, 1026, 1.5, Number.NaN]) expect(findPokemon(id)).toBeNull()
  })

  it('regroupe les évolutions à branches (Évoli)', () => {
    const evoli = findPokemon(133)!
    expect(evoli.chain[0]).toEqual([{ id: 133, fr: 'Évoli' }])
    expect(evoli.chain[1]).toHaveLength(8)
  })
})
