import { describe, expect, it } from 'vitest'
import {
  POKEMON_TYPES,
  TYPE_KEYS,
  defensiveMatchups,
  formatMultiplier,
  pokemonPath,
  slugify,
  statTotal,
  strongestStat,
  typeEffectiveness,
} from '../../shared/utils/pokemon'

describe('table des types', () => {
  it('connaît les 18 types', () => {
    expect(TYPE_KEYS).toHaveLength(18)
  })

  it('applique les multiplicateurs de base', () => {
    expect(typeEffectiveness('fire', ['grass'])).toBe(2)
    expect(typeEffectiveness('water', ['grass'])).toBe(0.5)
    expect(typeEffectiveness('normal', ['ghost'])).toBe(0)
    expect(typeEffectiveness('ground', ['flying'])).toBe(0)
    expect(typeEffectiveness('electric', ['normal'])).toBe(1)
  })

  it('multiplie pour les doubles types', () => {
    expect(typeEffectiveness('ice', ['dragon', 'flying'])).toBe(4)
    expect(typeEffectiveness('fire', ['water', 'dragon'])).toBe(0.25)
  })

  it('classe faiblesses, résistances et immunités', () => {
    const normal = defensiveMatchups(['normal'])
    expect(normal.weaknesses).toEqual([{ type: 'fighting', multiplier: 2 }])
    expect(normal.immunities).toEqual([{ type: 'ghost', multiplier: 0 }])
    expect(normal.resistances).toEqual([])
    expect(defensiveMatchups(['dragon', 'flying']).weaknesses[0]).toEqual({ type: 'ice', multiplier: 4 })
  })

  it('affiche les multiplicateurs lisiblement', () => {
    expect([4, 2, 0.5, 0.25, 0].map(formatMultiplier)).toEqual(['×4', '×2', '×½', '×¼', '×0'])
  })
})

function relativeLuminance(hexColor: string) {
  const [red, green, blue] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hexColor.slice(start, start + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrastRatio(colorA: string, colorB: string) {
  const [lighter, darker] = [relativeLuminance(colorA), relativeLuminance(colorB)].toSorted((a, b) => b - a) as [
    number,
    number,
  ]
  return (lighter + 0.05) / (darker + 0.05)
}

describe('accessibilité des badges de type', () => {
  it.each(TYPE_KEYS)('%s : texte lisible (≥ 4,5:1)', (type) => {
    const { color, textColor } = POKEMON_TYPES[type]
    expect(contrastRatio(color, textColor)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('statistiques', () => {
  const ronflexStats = { hp: 160, attack: 110, defense: 65, specialAttack: 65, specialDefense: 110, speed: 30 }

  it('calcule le total', () => {
    expect(statTotal(ronflexStats)).toBe(540)
  })

  it('trouve la meilleure statistique', () => {
    expect(strongestStat(ronflexStats)).toBe('hp')
  })
})

describe('adresses des fiches', () => {
  it('fabrique des slugs sans accents ni symboles', () => {
    expect(slugify('Évoli')).toBe('evoli')
    expect(slugify('M. Mime')).toBe('m-mime')
    expect(slugify('Nidoran♀')).toBe('nidoran-f')
    expect(slugify('Nidoran♂')).toBe('nidoran-m')
    expect(slugify('Type:0')).toBe('type-0')
    expect(slugify('Mime Jr.')).toBe('mime-jr')
  })

  it('préfixe le numéro', () => {
    expect(pokemonPath({ id: 706, name: 'Muplodocus' })).toBe('/pokemon/706-muplodocus')
  })
})
