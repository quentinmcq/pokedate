import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { StoredPokedex, StoredPokemon } from '../server/data/storedPokedex'
import type { TypeKey } from '../shared/types/pokemon'
import { POKEMON_COUNT } from '../shared/utils/pokemon'

const OUTPUT_FILE = join(import.meta.dirname, '..', 'server', 'data', 'pokemon.json')
const POKEAPI_URL = 'https://pokeapi.co/api/v2'
const POKEPEDIA_URL = 'https://www.pokepedia.fr'
const POKEPEDIA_DELAY_MS = 500
const USER_AGENT = 'PokeDate/1.0 (projet de fan non commercial)'
const PARALLEL_REQUESTS = 12
const REQUEST_ATTEMPTS = 4

interface NamedResource {
  name: string
  url: string
}

interface LocalizedName {
  name: string
  language: NamedResource
}

interface ApiPokemon {
  id: number
  height: number
  weight: number
  types: { slot: number; type: NamedResource }[]
  stats: { base_stat: number; stat: NamedResource }[]
  abilities: { slot: number; is_hidden: boolean; ability: NamedResource }[]
}

interface ApiSpecies {
  name: string
  names: LocalizedName[]
  genera: { genus: string; language: NamedResource }[]
  flavor_text_entries: { flavor_text: string; language: NamedResource }[]
  generation: NamedResource
  is_legendary: boolean
  is_mythical: boolean
  is_baby: boolean
  evolution_chain: { url: string } | null
}

interface ApiAbility {
  name: string
  names: LocalizedName[]
}

interface ApiEvolutionNode {
  species: NamedResource
  evolves_to: ApiEvolutionNode[]
}

const responseCache = new Map<string, unknown>()

async function fetchJson<T>(url: string): Promise<T> {
  if (responseCache.has(url)) return responseCache.get(url) as T
  for (let attempt = 1; attempt <= REQUEST_ATTEMPTS; attempt++) {
    const response = await fetch(url).catch(() => null)
    if (response?.ok) {
      const json = (await response.json()) as T
      responseCache.set(url, json)
      return json
    }
    if (attempt < REQUEST_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, 800 * attempt))
  }
  throw new Error(`Échec après ${REQUEST_ATTEMPTS} tentatives : ${url}`)
}

async function mapInParallel<Item, Result>(items: Item[], mapItem: (item: Item) => Promise<Result>) {
  const results: Result[] = []
  let nextIndex = 0
  await Promise.all(
    Array.from({ length: PARALLEL_REQUESTS }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex++
        results[index] = await mapItem(items[index]!)
      }
    }),
  )
  return results
}

const inLanguage = <Entry extends { language: NamedResource }>(entries: Entry[], language: string) =>
  entries.filter((entry) => entry.language.name === language)

const cleanFlavorText = (text: string) =>
  text
    .replace(/[\n\f­\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const idFromResourceUrl = (url: string) => Number(url.split('/').filter(Boolean).pop())

const GENERATION_NUMBERS: Record<string, number> = {
  'generation-i': 1,
  'generation-ii': 2,
  'generation-iii': 3,
  'generation-iv': 4,
  'generation-v': 5,
  'generation-vi': 6,
  'generation-vii': 7,
  'generation-viii': 8,
  'generation-ix': 9,
}

const STAT_NAMES = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'] as const

function evolutionStages(root: ApiEvolutionNode) {
  const stages: number[][] = []
  const visit = (node: ApiEvolutionNode, depth: number) => {
    const id = idFromResourceUrl(node.species.url)
    if (id <= POKEMON_COUNT) (stages[depth] ??= []).push(id)
    node.evolves_to.forEach((child) => visit(child, depth + 1))
  }
  visit(root, 0)
  return stages.filter((stage) => stage.length > 0)
}

console.info('Pokémon et espèces…')
const pokemonIds = Array.from({ length: POKEMON_COUNT }, (_, index) => index + 1)
const fetched = await mapInParallel(pokemonIds, async (id) => {
  const [pokemon, species] = await Promise.all([
    fetchJson<ApiPokemon>(`${POKEAPI_URL}/pokemon/${id}`),
    fetchJson<ApiSpecies>(`${POKEAPI_URL}/pokemon-species/${id}`),
  ])
  return { pokemon, species }
})

console.info('Talents…')
const abilityUrls = [...new Set(fetched.flatMap(({ pokemon }) => pokemon.abilities.map(({ ability }) => ability.url)))]
const frenchAbilityNames = new Map<string, string>()
await mapInParallel(abilityUrls, async (url) => {
  const ability = await fetchJson<ApiAbility>(url)
  frenchAbilityNames.set(url, inLanguage(ability.names, 'fr')[0]?.name ?? ability.name)
})

console.info("Chaînes d'évolution…")
const chainUrls = [
  ...new Set(fetched.map(({ species }) => species.evolution_chain?.url).filter((url) => url !== undefined)),
]
chainUrls.sort((a, b) => idFromResourceUrl(a) - idFromResourceUrl(b))
const chains = await mapInParallel(chainUrls, async (url) =>
  evolutionStages((await fetchJson<{ chain: ApiEvolutionNode }>(url)).chain),
)
const chainIndexByUrl = new Map(chainUrls.map((url, index) => [url, index]))

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
}
const decodeHtml = (text: string) =>
  text.replace(/&(amp|quot|#39|lt|gt|nbsp);/g, (entity) => HTML_ENTITIES[entity] ?? entity)
const PLACEHOLDER_DESCRIPTION = /^En l'absence de Pokédex/
const SPIN_OFF_GAMES = /Pokémon (GO|Sleep|HOME|Masters)/
const stripTags = (markup: string) =>
  decodeHtml(markup.replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim()

async function frenchDescriptionFromPokepedia(frenchName: string) {
  const response = await fetch(`${POKEPEDIA_URL}/${encodeURIComponent(frenchName.replace(/ /g, '_'))}`, {
    headers: { 'user-agent': USER_AGENT },
  }).catch(() => null)
  if (!response?.ok) return null
  const page = await response.text()
  const section = page.indexOf('id="Descriptions_du_Pokédex"')
  if (section < 0) return null
  const list = /<dl[^>]*>([\s\S]*?)<\/dl>/.exec(page.slice(section))?.[1] ?? ''
  const entries = [...list.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g)].map((match) => ({
    game: stripTags(match[1] ?? ''),
    text: stripTags(match[2] ?? ''),
  }))
  const realDescriptions = entries.filter(({ text }) => /\p{L}{3}/u.test(text) && !PLACEHOLDER_DESCRIPTION.test(text))
  const fromMainGames = realDescriptions.filter(({ game }) => !SPIN_OFF_GAMES.test(game))
  return (fromMainGames.at(-1) ?? realDescriptions.at(-1))?.text ?? null
}

const withPokemonPrefix = (genus: string) => (genus && !genus.startsWith('Pokémon') ? `Pokémon ${genus}` : genus)

function toStoredPokemon({ pokemon, species }: { pokemon: ApiPokemon; species: ApiSpecies }): StoredPokemon {
  const frenchFlavorTexts = inLanguage(species.flavor_text_entries, 'fr')
  const englishFlavorTexts = inLanguage(species.flavor_text_entries, 'en')
  const flavorText = (frenchFlavorTexts.at(-1) ?? englishFlavorTexts.at(-1))?.flavor_text ?? ''
  const baseStat = (statName: string) => pokemon.stats.find(({ stat }) => stat.name === statName)?.base_stat ?? 0
  const genus = inLanguage(species.genera, 'fr')[0]?.genus ?? inLanguage(species.genera, 'en')[0]?.genus ?? ''

  return {
    id: pokemon.id,
    fr: inLanguage(species.names, 'fr')[0]?.name ?? species.name,
    en: inLanguage(species.names, 'en')[0]?.name ?? species.name,
    genus: withPokemonPrefix(genus),
    types: pokemon.types
      .toSorted((a, b) => a.slot - b.slot)
      .map(({ type }) => type.name as TypeKey) as StoredPokemon['types'],
    h: pokemon.height / 10,
    w: pokemon.weight / 10,
    stats: STAT_NAMES.map(baseStat) as StoredPokemon['stats'],
    ab: pokemon.abilities
      .toSorted((a, b) => a.slot - b.slot)
      .map(({ ability, is_hidden }) => [frenchAbilityNames.get(ability.url) ?? ability.name, is_hidden ? 1 : 0]),
    desc: cleanFlavorText(flavorText),
    gen: GENERATION_NUMBERS[species.generation.name] ?? 0,
    rare: species.is_mythical ? 2 : species.is_legendary ? 1 : 0,
    baby: species.is_baby ? 1 : 0,
    evo: species.evolution_chain ? (chainIndexByUrl.get(species.evolution_chain.url) ?? -1) : -1,
  }
}

const storedPokemon = fetched.map(toStoredPokemon)
const idsWithoutFrenchDescription = new Set(
  fetched
    .filter(({ species }) => inLanguage(species.flavor_text_entries, 'fr').length === 0)
    .map(({ pokemon }) => pokemon.id),
)

console.info('Descriptions françaises manquantes (Poképédia)…')
for (const pokemon of storedPokemon.filter((stored) => idsWithoutFrenchDescription.has(stored.id))) {
  const description = await frenchDescriptionFromPokepedia(pokemon.fr)
  if (description) pokemon.desc = description
  else console.info(`  pas de description française pour #${pokemon.id} ${pokemon.fr}`)
  await new Promise((resolve) => setTimeout(resolve, POKEPEDIA_DELAY_MS))
}

const pokedex: StoredPokedex = { pokemon: storedPokemon, chains }
writeFileSync(OUTPUT_FILE, JSON.stringify(pokedex))
console.info(`OK : ${OUTPUT_FILE} (${pokedex.pokemon.length} Pokémon, ${chains.length} chaînes)`)
