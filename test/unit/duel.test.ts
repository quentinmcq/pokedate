import { describe, expect, it } from 'vitest'
import type { Fighter } from '../../shared/utils/duel'
import { computeAttack, describeEffectiveness, describeKnockOut, resolveDuel } from '../../shared/utils/duel'

const fighter = (
  id: number,
  types: Fighter['types'],
  [hp, attack, defense, specialAttack, specialDefense, speed]: number[],
) => ({ id, types, stats: { hp, attack, defense, specialAttack, specialDefense, speed } }) as Fighter

const pikachu = fighter(25, ['electric'], [35, 55, 40, 50, 50, 90])
const racaillou = fighter(74, ['rock', 'ground'], [40, 80, 100, 30, 30, 20])
const ectoplasma = fighter(94, ['ghost', 'poison'], [60, 65, 60, 130, 75, 110])
const ronflex = fighter(143, ['normal'], [160, 110, 65, 65, 110, 30])
const fantominus = fighter(92, ['ghost'], [30, 35, 30, 100, 35, 80])
const rattata = fighter(19, ['normal'], [30, 56, 35, 25, 35, 72])

describe('computeAttack', () => {
  it('choisit le type le plus efficace', () => {
    expect(computeAttack(racaillou, pikachu)).toMatchObject({ type: 'ground', multiplier: 2 })
  })

  it('ne fait aucun dégât à un Pokémon immunisé', () => {
    expect(computeAttack(pikachu, racaillou)).toMatchObject({ multiplier: 0, damage: 0, turnsToKnockOut: Infinity })
  })
})

describe('resolveDuel', () => {
  it('fait gagner le Pokémon qui met K.O. le premier', () => {
    expect(resolveDuel(racaillou, pikachu).winner).toBe('A')
    expect(resolveDuel(pikachu, racaillou).winner).toBe('B')
  })

  it('déclare un match nul si personne ne peut toucher l’autre', () => {
    expect(resolveDuel(fantominus, rattata).winner).toBeNull()
  })

  it('déclare un match miroir pour deux fois le même Pokémon', () => {
    expect(resolveDuel(ronflex, ronflex).winner).toBeNull()
  })

  it('fait frapper en premier le plus rapide', () => {
    expect(resolveDuel(ectoplasma, ronflex).firstStriker).toBe('A')
    expect(resolveDuel(ronflex, ectoplasma).firstStriker).toBe('B')
  })
})

describe('textes du combat', () => {
  it('décrit l’efficacité', () => {
    expect(describeEffectiveness(0)).toContain('aucun effet')
    expect(describeEffectiveness(4)).toContain('ultra')
    expect(describeEffectiveness(2)).toContain('super')
    expect(describeEffectiveness(0.5)).toContain('pas très')
    expect(describeEffectiveness(1)).toContain('normalement')
  })

  it('décrit le K.O.', () => {
    expect(describeKnockOut(1)).toBe('le met K.O. en 1 tour')
    expect(describeKnockOut(3)).toBe('le met K.O. en 3 tours')
    expect(describeKnockOut(Infinity)).toBe('ne peut pas le toucher')
  })
})
