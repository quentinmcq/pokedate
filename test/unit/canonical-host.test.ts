import { describe, expect, it } from 'vitest'
import { canonicalRedirectUrl } from '../../server/utils/canonicalHost'

const SITE_URL = 'https://pokedate.fr'

describe('canonicalRedirectUrl', () => {
  it('renvoie www et l’adresse workers.dev vers pokedate.fr, en gardant la page et ses paramètres', () => {
    expect(canonicalRedirectUrl(new URL('https://www.pokedate.fr/pokemon/25-pikachu?partage=1'), SITE_URL)).toBe(
      'https://pokedate.fr/pokemon/25-pikachu?partage=1',
    )
    expect(canonicalRedirectUrl(new URL('https://pokedate.quentin-macq.workers.dev/duel?pa=1&pb=4'), SITE_URL)).toBe(
      'https://pokedate.fr/duel?pa=1&pb=4',
    )
  })

  it('laisse passer le domaine principal et le développement local', () => {
    expect(canonicalRedirectUrl(new URL('https://pokedate.fr/'), SITE_URL)).toBeNull()
    expect(canonicalRedirectUrl(new URL('http://localhost:8789/'), SITE_URL)).toBeNull()
  })
})
