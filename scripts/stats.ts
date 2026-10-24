import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { StoredPokedex } from '../server/data/storedPokedex'
import type { TrackedEvent } from '../shared/utils/trackedEvents'

const DEFAULT_DAYS = 7
const TOP_POKEMON_SHOWN = 10
const days = Number(process.argv[2] ?? DEFAULT_DAYS)
if (!Number.isInteger(days) || days < 1) throw new Error('Usage : bun run stats [nombre de jours]')

const EVENT_LABELS: Record<TrackedEvent, string> = {
  reveal: 'Pokémon révélés (date saisie)',
  random: 'Tirages au hasard',
  duel: 'Duels lancés',
  tournament: 'Tournois lancés',
  share: 'Partages',
  transfer: 'Transferts de Pokédex préparés',
  import: 'Pokédex importés',
  publish: 'Tirages publiés',
  install: 'Installations de l’appli',
  pokebrawl: 'Clics vers PokéBrawl',
}

const QUERY_ATTEMPTS = 3

// Wrangler sometimes fails once while it refreshes its login: the query is simply sent again.
function queryDatabase<Row>(sql: string): Row[] {
  let lastError = ''
  for (let attempt = 1; attempt <= QUERY_ATTEMPTS; attempt++) {
    const command = spawnSync(
      'bunx',
      ['wrangler', 'd1', 'execute', 'pokedate', '--remote', '--json', '--command', sql],
      {
        encoding: 'utf8',
      },
    )
    if (command.status === 0) return JSON.parse(command.stdout)[0].results as Row[]
    lastError = command.stderr || command.stdout
  }
  throw new Error(lastError)
}

const since = `date('now', '-${days - 1} days')`
const totals = queryDatabase<{ name: TrackedEvent; total: number }>(
  `SELECT name, SUM(count) AS total FROM event_counts WHERE day >= ${since} GROUP BY name ORDER BY total DESC`,
)
const perDay = queryDatabase<{ day: string; total: number }>(
  `SELECT day, SUM(count) AS total FROM event_counts WHERE day >= ${since} GROUP BY day ORDER BY day`,
)

const topPokemon = queryDatabase<{ pokemon_id: number; total: number; shiny: number }>(
  `SELECT pokemon_id, SUM(count) AS total, SUM(shiny_count) AS shiny FROM pokemon_reveal_counts WHERE day >= ${since} GROUP BY pokemon_id ORDER BY total DESC LIMIT ${TOP_POKEMON_SHOWN}`,
)
const pokedex = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', 'server', 'data', 'pokemon.json'), 'utf8'),
) as StoredPokedex
const pokemonName = (id: number) => pokedex.pokemon[id - 1]?.fr ?? `#${id}`

console.info(`\nPokéDate, ${days} derniers jours\n`)
if (!totals.length) console.info('Aucune action enregistrée pour l’instant.')
for (const { name, total } of totals) console.info(`${String(total).padStart(6)}  ${EVENT_LABELS[name] ?? name}`)
if (perDay.length) {
  console.info('\nPar jour (toutes actions)')
  for (const { day, total } of perDay) console.info(`  ${day}  ${'█'.repeat(Math.min(total, 60))} ${total}`)
}
if (topPokemon.length) {
  console.info('\nPokémon les plus révélés (publiés ou non, révélations répétées comprises)')
  for (const { pokemon_id, total, shiny } of topPokemon)
    console.info(`${String(total).padStart(6)}  ${pokemonName(pokemon_id)}${shiny ? ` (dont ${shiny} shiny)` : ''}`)
}
console.info('\nVisiteurs et pages vues : tableau de bord Cloudflare, Web Analytics.\n')
