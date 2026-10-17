import { describe, expect, it } from 'vitest'
import {
  TYPES,
  TYPE_KEYS,
  heightHint,
  matchupsFor,
  multLabel,
  pokemonPath,
  slugify,
  typeEffect,
  weightHint,
} from '../../shared/utils/pokemon'

describe('table des types', () => {
  it('connaît les 18 types', () => {
    expect(TYPE_KEYS).toHaveLength(18)
  })

  it('applique les multiplicateurs de base', () => {
    expect(typeEffect('fire', ['grass'])).toBe(2)
    expect(typeEffect('water', ['grass'])).toBe(0.5)
    expect(typeEffect('normal', ['ghost'])).toBe(0)
    expect(typeEffect('ground', ['flying'])).toBe(0)
    expect(typeEffect('electric', ['normal'])).toBe(1)
  })

  it('multiplie pour les doubles types', () => {
    expect(typeEffect('ice', ['dragon', 'flying'])).toBe(4)
    expect(typeEffect('fire', ['water', 'dragon'])).toBe(0.25)
  })

  it('classe faiblesses, résistances et immunités', () => {
    const normal = matchupsFor(['normal'])
    expect(normal.weak).toEqual([['fighting', 2]])
    expect(normal.immune).toEqual([['ghost', 0]])
    expect(normal.resist).toEqual([])

    const dragonFlying = matchupsFor(['dragon', 'flying'])
    expect(dragonFlying.weak[0]).toEqual(['ice', 4])
  })

  it('affiche les multiplicateurs lisiblement', () => {
    expect([4, 2, 0.5, 0.25, 0].map(multLabel)).toEqual(['×4', '×2', '×½', '×¼', '×0'])
  })
})
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].toSorted((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

describe('accessibilité des badges de type', () => {
  it.each(TYPE_KEYS)('%s : texte lisible (≥ 4,5:1)', (t) => {
    const [, bg, , ink] = TYPES[t]
    expect(contrast(bg, ink)).toBeGreaterThanOrEqual(4.5)
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
    expect(pokemonPath({ id: 706, fr: 'Muplodocus' })).toBe('/pokemon/706-muplodocus')
  })
})

describe('comparaisons amusantes', () => {
  it('compare la taille à un humain', () => {
    expect(heightHint(0.2)).toContain('poche')
    expect(heightHint(3.4)).toContain('2× ta taille')
  })

  it('compte le poids en baguettes', () => {
    expect(weightHint(0.1)).toContain('Plus léger')
    expect(weightHint(6.5)).toBe('≈ 26 baguettes 🥖')
  })
})
