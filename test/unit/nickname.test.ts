import { describe, expect, it } from 'vitest'
import { checkNickname } from '../../shared/utils/nickname'

const isAccepted = (value: string) => checkNickname(value).ok

describe('checkNickname', () => {
  it('accepte les pseudos ordinaires et nettoie les espaces', () => {
    for (const nickname of [
      'Quentin',
      'Léa',
      'Jean-Marc',
      "D'Artagnan",
      'Sacha 2026',
      'Zoé_42',
      'Constance',
      'Thomas',
      'Bassem',
      'Bob Itel',
    ])
      expect(isAccepted(nickname), nickname).toBe(true)
    expect(checkNickname('  Max   le   Dresseur ')).toEqual({ ok: true, nickname: 'Max le Dresseur' })
  })

  it('publie en « Anonyme » sans pseudo', () => {
    expect(checkNickname('')).toEqual({ ok: true, nickname: 'Anonyme' })
    expect(checkNickname('   ')).toEqual({ ok: true, nickname: 'Anonyme' })
    expect(checkNickname(undefined)).toEqual({ ok: true, nickname: 'Anonyme' })
  })

  it('refuse les pseudos trop courts ou trop longs', () => {
    expect(isAccepted('A')).toBe(false)
    expect(isAccepted('A'.repeat(21))).toBe(false)
  })

  it('refuse les liens et les caractères spéciaux', () => {
    for (const nickname of ['site.com', 'http://x', 'moi@mail', '<script>', 'a/b'])
      expect(isAccepted(nickname), nickname).toBe(false)
  })

  it('refuse les insultes, même déguisées', () => {
    for (const nickname of ['connard', 'C0NN4RD', 'gros con', 'Sal0pe', 'f u c k', 'Fdp', 'nazi_88'])
      expect(isAccepted(nickname), nickname).toBe(false)
  })
})
