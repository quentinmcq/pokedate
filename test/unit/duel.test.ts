import { describe, expect, it } from 'vitest'
import { attack, duel, effectText } from '../../shared/utils/duel'
const pikachu = { id: 25, types: ['electric' as const], stats: [35, 55, 40, 50, 50, 90] }
const racaillou = { id: 74, types: ['rock' as const, 'ground' as const], stats: [40, 80, 100, 30, 30, 20] }
const ectoplasma = { id: 94, types: ['ghost' as const, 'poison' as const], stats: [60, 65, 60, 130, 75, 110] }
const ronflex = { id: 143, types: ['normal' as const], stats: [160, 110, 65, 65, 110, 30] }

describe('attack', () => {
  it('choisit le type le plus efficace', () => {
    expect(attack(racaillou, pikachu)).toMatchObject({ type: 'ground', mult: 2 })
  })

  it('ne fait aucun dégât à un Pokémon immunisé', () => {
    const a = attack(pikachu, racaillou)
    expect(a.mult).toBe(0)
    expect(a.dmg).toBe(0)
    expect(a.turns).toBe(Infinity)
  })
})

describe('duel', () => {
  it('fait gagner le Pokémon qui met K.O. le premier', () => {
    expect(duel(racaillou, pikachu).winner).toBe('A')
    expect(duel(pikachu, racaillou).winner).toBe('B')
  })

  it('déclare un match nul si personne ne peut toucher l’autre', () => {
    const fantome = { id: 92, types: ['ghost' as const], stats: [30, 35, 30, 100, 35, 80] }
    const normal = { id: 19, types: ['normal' as const], stats: [30, 56, 35, 25, 35, 72] }
    expect(duel(fantome, normal).winner).toBeNull()
  })

  it('déclare un match miroir pour deux fois le même Pokémon', () => {
    expect(duel(ronflex, ronflex).winner).toBeNull()
  })

  it('fait frapper en premier le plus rapide', () => {
    expect(duel(ectoplasma, ronflex).aFirst).toBe(true)
    expect(duel(ronflex, ectoplasma).aFirst).toBe(false)
  })
})

describe('effectText', () => {
  it('décrit l’efficacité', () => {
    expect(effectText(0)).toContain('aucun effet')
    expect(effectText(4)).toContain('ultra')
    expect(effectText(2)).toContain('super')
    expect(effectText(0.5)).toContain('pas très')
    expect(effectText(1)).toContain('normalement')
  })
})
