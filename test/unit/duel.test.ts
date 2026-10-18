import { describe, expect, it } from 'vitest'
import type { Fighter } from '../../shared/utils/duel'
import { computeAttack, describeAttack, describeDuelTempo, resolveDuel } from '../../shared/utils/duel'
import { translateEn, translateFr } from './translators'

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

const named = <T extends Fighter>(pokemon: T, name: string) => ({ ...pokemon, name })

describe('textes du combat', () => {
  it('décrit une attaque, son efficacité et le K.O.', () => {
    expect(describeAttack(translateFr, 'fr', 'Racaillou', 'Pikachu', computeAttack(racaillou, pikachu))).toBe(
      "Racaillou lance une attaque Sol : c'est super efficace (×2) ! Pikachu tombe K.O. dès le premier coup.",
    )
    expect(
      describeAttack(translateFr, 'fr', 'Ronflex', 'Rattata', {
        type: 'normal',
        multiplier: 1,
        damage: 10,
        turnsToKnockOut: 3,
      }),
    ).toBe('Ronflex lance une attaque Normal : efficacité normale (×1). Rattata tombe K.O. en 3 coups.')
    expect(describeAttack(translateFr, 'fr', 'Pikachu', 'Racaillou', computeAttack(pikachu, racaillou))).toBe(
      "Pikachu lance une attaque Électrik, mais elle n'a aucun effet sur Racaillou.",
    )
  })

  it('explique qui frappe en premier et pourquoi il gagne ou perd', () => {
    const fighters = { A: named(ectoplasma, 'Ectoplasma'), B: named(ronflex, 'Ronflex') }
    const outcome = resolveDuel(ectoplasma, ronflex)
    expect(describeDuelTempo(translateFr, fighters, { ...outcome, winner: 'B' })).toBe(
      'Ectoplasma est plus rapide et frappe en premier, mais Ronflex le met K.O. plus vite.',
    )
    expect(describeDuelTempo(translateFr, fighters, { ...outcome, winner: 'A' })).toMatch(/^Ectoplasma est plus rapide/)
  })

  it('raconte le combat en anglais', () => {
    expect(describeAttack(translateEn, 'en', 'Geodude', 'Pikachu', computeAttack(racaillou, pikachu))).toBe(
      "Geodude uses a Ground-type attack: it's super effective (×2)! Pikachu faints from the very first hit.",
    )
  })

  it('gère le match miroir et le match nul', () => {
    const mirror = { A: named(ronflex, 'Ronflex'), B: named(ronflex, 'Ronflex') }
    expect(describeDuelTempo(translateFr, mirror, resolveDuel(ronflex, ronflex))).toContain(
      'impossible de les départager',
    )
    const ghosts = { A: named(fantominus, 'Fantominus'), B: named(rattata, 'Rattata') }
    expect(describeDuelTempo(translateFr, ghosts, resolveDuel(fantominus, rattata))).toBe(
      "Aucun des deux ne peut toucher l'autre.",
    )
  })
})
