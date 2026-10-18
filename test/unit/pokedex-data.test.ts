import { describe, expect, it } from 'vitest'
import { findPokemon, listPokedexEntries } from '../../server/utils/pokedex'
import { POKEMON_COUNT, slugify } from '../../shared/utils/pokemon'

describe('données des Pokémon', () => {
  it('contient les 1025 Pokémon dans l’ordre', () => {
    const entries = listPokedexEntries()
    expect(entries).toHaveLength(POKEMON_COUNT)
    entries.forEach((entry, index) => expect(entry.id).toBe(index + 1))
  })

  it('donne à chaque Pokémon un nom, des types et 6 statistiques', () => {
    for (let id = 1; id <= POKEMON_COUNT; id++) {
      const pokemon = findPokemon(id)!
      expect(pokemon.name.length).toBeGreaterThan(0)
      expect(pokemon.types.length).toBeGreaterThanOrEqual(1)
      expect(Object.keys(pokemon.stats)).toHaveLength(6)
      expect(pokemon.evolutionStages.flat().some((evolution) => evolution.id === id)).toBe(true)
    }
  })

  it('a des adresses uniques pour toutes les fiches', () => {
    const slugs = listPokedexEntries().map((entry) => slugify(entry.name))
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(slugs.every((slug) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))).toBe(true)
  })

  it('a aussi des adresses uniques en anglais', () => {
    const slugs = listPokedexEntries('en').map((entry) => slugify(entry.name))
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(slugs.every((slug) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))).toBe(true)
  })

  it('donne la fiche en anglais', () => {
    expect(findPokemon(706, 'en')).toMatchObject({
      name: 'Goodra',
      otherLanguageName: 'Muplodocus',
      genus: 'Dragon Pokémon',
    })
    expect(findPokemon(706, 'en')!.description.length).toBeGreaterThan(0)
  })

  it('renvoie la fiche complète avec ses voisins', () => {
    const pokemon = findPokemon(706)!
    expect(pokemon).toMatchObject({ id: 706, name: 'Muplodocus', types: ['dragon'] })
    expect(pokemon.previous).toEqual({ id: 705, name: expect.any(String) })
    expect(pokemon.next).toEqual({ id: 707, name: expect.any(String) })
    expect(pokemon.evolutionStages).toHaveLength(3)
  })

  it('n’a pas de voisin avant le n° 1 ni après le dernier', () => {
    expect(findPokemon(1)!.previous).toBeNull()
    expect(findPokemon(POKEMON_COUNT)!.next).toBeNull()
  })

  it('ne renvoie rien pour un numéro inexistant', () => {
    for (const id of [0, -1, 1026, 1.5, Number.NaN]) expect(findPokemon(id)).toBeNull()
  })

  it('regroupe les évolutions à branches (Évoli)', () => {
    const evoli = findPokemon(133)!
    expect(evoli.evolutionStages[0]).toEqual([{ id: 133, name: 'Évoli' }])
    expect(evoli.evolutionStages[1]).toHaveLength(8)
  })
})
