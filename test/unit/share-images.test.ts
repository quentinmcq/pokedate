import { describe, expect, it } from 'vitest'
import { duelLayers, tournamentLayers } from '../../server/utils/shareImageComposer'
import {
  SHARE_FRAMES,
  duelShareImagePath,
  parseSharedFighters,
  tournamentShareImagePath,
} from '../../shared/utils/shareImages'
import { translateEn, translateFr } from './translators'

const pikachu = { pokemonId: 25, shiny: false, name: 'Pikachu' }
const shinyCharizard = { pokemonId: 6, shiny: true, name: 'Dracaufeu' }
const mewtwo = { pokemonId: 150, shiny: false, name: 'Mewtwo' }

describe('adresses des images de partage', () => {
  it('encode les Pokémon et leur version shiny sans nom de joueur', () => {
    expect(duelShareImagePath(pikachu, shinyCharizard)).toBe('/og/duel/25-6s.jpg')
    expect(tournamentShareImagePath([mewtwo, pikachu, shinyCharizard])).toBe('/og/tournoi/150-25-6s.jpg')
  })

  it('ajoute la langue anglaise à l’adresse', () => {
    expect(duelShareImagePath(pikachu, shinyCharizard, 'en')).toBe('/og/duel/25-6s.en.jpg')
    expect(parseSharedFighters('25-6s.en.jpg', 2)).toHaveLength(2)
  })

  it('relit une adresse valide', () => {
    expect(parseSharedFighters('25-6s.jpg', 2)).toEqual([
      { pokemonId: 25, shiny: false },
      { pokemonId: 6, shiny: true },
    ])
  })

  it('refuse les adresses mal formées', () => {
    for (const fileName of ['25-6.png', '25.jpg', '0-6.jpg', '1026-6.jpg', '025-6.jpg', '25-6x.jpg', '25-6-7.jpg'])
      expect(parseSharedFighters(fileName, 2)).toBeNull()
  })
})

const textsOf = (layers: ReturnType<typeof duelLayers>['layers']) =>
  layers.flatMap((layer) => (layer.kind === 'text' ? [layer.content] : []))

describe('composition des images de partage', () => {
  it('met le gagnant du duel en avant', () => {
    const { frame, layers } = duelLayers(translateFr, pikachu, shinyCharizard, 'B')
    expect(frame).toBe(SHARE_FRAMES.duelRightWins)
    expect(textsOf(layers)).toContain('Dracaufeu remporte le duel')
    const pikachuLayer = layers.find((layer) => layer.kind === 'artwork' && layer.fighter.pokemonId === 25)
    expect(pikachuLayer?.position.opacity).toBeLessThan(1)
  })

  it('distingue le match nul du match miroir', () => {
    expect(textsOf(duelLayers(translateFr, pikachu, shinyCharizard, null).layers)).toContain('Match nul !')
    expect(textsOf(duelLayers(translateFr, pikachu, pikachu, null).layers)).toContain('Match miroir !')
  })

  it('titre le tournoi avec le champion', () => {
    const { frame, layers } = tournamentLayers(translateFr, [mewtwo, pikachu, shinyCharizard])
    expect(frame).toBe(SHARE_FRAMES.tournament)
    expect(textsOf(layers)).toContain('Mewtwo remporte le tournoi')
  })

  it('écrit les titres en anglais', () => {
    expect(textsOf(duelLayers(translateEn, pikachu, shinyCharizard, 'A').layers)).toContain('Pikachu wins the duel')
  })
})
