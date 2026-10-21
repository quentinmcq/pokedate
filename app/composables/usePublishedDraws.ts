import type { PublishedDraw } from '#shared/types/pokemon'

const DRAWS_STORAGE_KEY = 'pokedate.published-draws'
const NICKNAME_STORAGE_KEY = 'pokedate.nickname'
const AUTO_PUBLISH_STORAGE_KEY = 'pokedate.auto-publish'
const KEPT_DAYS = 7
export const DAILY_AUTO_PUBLISH_LIMIT = 5

export interface Publication {
  pokemonId: number
  shiny: boolean
  day: string
  drawId: number
  editToken: string
  removed?: true
}

export interface PublishedPokemon {
  pokemonId: number
  shiny: boolean
  bonusPokemonId: number | null
}

const todayIso = () => toIsoDate(todayAsCalendarDate())

export const publicationErrorKey = (error: unknown, fallbackKey: string) =>
  (error as { statusCode?: number })?.statusCode === 429 ? 'publication.tooFast' : fallbackKey

function readStorage(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {}
}

const isPublication = (value: unknown): value is Publication => {
  const entry = value as Partial<Publication> | null
  return (
    !!entry &&
    typeof entry.pokemonId === 'number' &&
    typeof entry.shiny === 'boolean' &&
    typeof entry.day === 'string' &&
    typeof entry.drawId === 'number' &&
    typeof entry.editToken === 'string'
  )
}

function readPublications() {
  try {
    const stored: unknown = JSON.parse(readStorage(DRAWS_STORAGE_KEY) ?? '[]')
    const oldestKeptDay = toIsoDate(todayAsCalendarDate(new Date(Date.now() - KEPT_DAYS * 24 * 60 * 60 * 1000)))
    return Array.isArray(stored) ? stored.filter(isPublication).filter((entry) => entry.day >= oldestKeptDay) : []
  } catch {
    return []
  }
}

const pendingPublications: Record<string, Promise<Publication>> = {}

const isSamePokemon = (entry: Publication, pokemon: Pick<PublishedPokemon, 'pokemonId' | 'shiny'>) =>
  entry.pokemonId === pokemon.pokemonId && entry.shiny === pokemon.shiny

export function usePublishedDraws() {
  const publications = useState<Publication[]>('published-draws', () => [])
  const nickname = useState('publication-nickname', () => ANONYMOUS_NICKNAME)
  const isAutoPublishEnabled = useState('auto-publish', () => true)

  function load() {
    publications.value = readPublications()
    const storedNickname = checkNickname(readStorage(NICKNAME_STORAGE_KEY))
    nickname.value = storedNickname.ok ? storedNickname.nickname : ANONYMOUS_NICKNAME
    isAutoPublishEnabled.value = readStorage(AUTO_PUBLISH_STORAGE_KEY) !== 'off'
  }

  function savePublications(next: Publication[]) {
    publications.value = next
    writeStorage(DRAWS_STORAGE_KEY, JSON.stringify(next))
  }

  const todaysPublicationOf = (pokemon: Pick<PublishedPokemon, 'pokemonId' | 'shiny'>) =>
    publications.value.find((entry) => entry.day === todayIso() && isSamePokemon(entry, pokemon)) ?? null

  const hasReachedDailyLimit = () =>
    publications.value.filter((entry) => entry.day === todayIso()).length >= DAILY_AUTO_PUBLISH_LIMIT

  async function sendPublication(pokemon: PublishedPokemon) {
    const { draw, editToken } = await $fetch<PublishedDraw>('/api/draws', {
      method: 'POST',
      body: { ...pokemon, nickname: nickname.value },
    })
    const publication: Publication = {
      pokemonId: pokemon.pokemonId,
      shiny: pokemon.shiny,
      day: todayIso(),
      drawId: draw.id,
      editToken,
    }
    savePublications([...publications.value.filter((entry) => !isSamePokemon(entry, pokemon)), publication])
    return publication
  }

  // Two reveals in a row mount two cards before the first answer arrives: they share one request.
  function publish(pokemon: PublishedPokemon) {
    const key = `${pokemon.pokemonId}-${pokemon.shiny}`
    pendingPublications[key] ??= sendPublication(pokemon).finally(() => delete pendingPublications[key])
    return pendingPublications[key]
  }

  async function remove(publication: Publication) {
    await $fetch(`/api/draws/${publication.drawId}`, {
      method: 'DELETE',
      headers: { 'x-edit-token': publication.editToken },
    })
    const removed: Publication = { ...publication, removed: true }
    savePublications(publications.value.map((entry) => (entry.drawId === publication.drawId ? removed : entry)))
    return removed
  }

  async function savePreferences(preferences: { nickname: string; autoPublish: boolean }, current: Publication | null) {
    if (current && !current.removed && preferences.nickname !== nickname.value)
      await $fetch(`/api/draws/${current.drawId}`, {
        method: 'PATCH',
        body: { editToken: current.editToken, nickname: preferences.nickname },
      })
    nickname.value = preferences.nickname
    isAutoPublishEnabled.value = preferences.autoPublish
    writeStorage(NICKNAME_STORAGE_KEY, preferences.nickname === ANONYMOUS_NICKNAME ? null : preferences.nickname)
    writeStorage(AUTO_PUBLISH_STORAGE_KEY, preferences.autoPublish ? null : 'off')
  }

  return {
    nickname: readonly(nickname),
    isAutoPublishEnabled: readonly(isAutoPublishEnabled),
    load,
    todaysPublicationOf,
    hasReachedDailyLimit,
    publish,
    remove,
    savePreferences,
  }
}
