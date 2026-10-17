import { describe, expect, it } from 'vitest'
import type { PokedexEntry } from '#shared/types/pokemon'

const ENTRIES: PokedexEntry[] = [
  { id: 25, name: 'Pikachu', types: ['electric'] },
  { id: 26, name: 'Raichu', types: ['electric'] },
  { id: 133, name: 'Évoli', types: ['normal'] },
  { id: 706, name: 'Muplodocus', types: ['dragon'] },
]

const names = (entries: PokedexEntry[]) => entries.map((entry) => entry.name)

describe('filterPokedexEntries', () => {
  it('cherche dans le nom sans tenir compte des accents ni de la casse', () => {
    expect(names(filterPokedexEntries(ENTRIES, { query: 'evo', type: null }))).toEqual(['Évoli'])
    expect(names(filterPokedexEntries(ENTRIES, { query: '  CHU ', type: null }))).toEqual(['Pikachu', 'Raichu'])
  })

  it('trouve un Pokémon par son numéro', () => {
    expect(names(filterPokedexEntries(ENTRIES, { query: '706', type: null }))).toEqual(['Muplodocus'])
    expect(names(filterPokedexEntries(ENTRIES, { query: '#25', type: null }))).toEqual(['Pikachu'])
    expect(names(filterPokedexEntries(ENTRIES, { query: 'n° 133', type: null }))).toEqual(['Évoli'])
  })

  it('filtre par type, seul ou avec une recherche', () => {
    expect(names(filterPokedexEntries(ENTRIES, { query: '', type: 'electric' }))).toEqual(['Pikachu', 'Raichu'])
    expect(names(filterPokedexEntries(ENTRIES, { query: 'rai', type: 'electric' }))).toEqual(['Raichu'])
    expect(filterPokedexEntries(ENTRIES, { query: 'pika', type: 'dragon' })).toEqual([])
  })

  it('renvoie tout quand rien n’est demandé', () => {
    expect(filterPokedexEntries(ENTRIES, { query: '', type: null })).toHaveLength(4)
  })
})
