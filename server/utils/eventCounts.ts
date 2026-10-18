import type { TrackedEvent } from '#shared/utils/trackedEvents'
import type { D1Database } from './cloudflareBindings'

export const todayInParisIso = () => toIsoDate(todayInTimeZone('Europe/Paris'))

export const incrementEventCount = (db: D1Database, name: TrackedEvent, day = todayInParisIso()) =>
  db
    .prepare(
      'INSERT INTO event_counts (day, name, count) VALUES (?, ?, 1) ON CONFLICT (day, name) DO UPDATE SET count = count + 1',
    )
    .bind(day, name)
    .run()

export const incrementPokemonRevealCount = (
  db: D1Database,
  { pokemonId, shiny }: { pokemonId: number; shiny: boolean },
  day = todayInParisIso(),
) =>
  db
    .prepare(
      'INSERT INTO pokemon_reveal_counts (day, pokemon_id, count, shiny_count) VALUES (?, ?, 1, ?) ON CONFLICT (day, pokemon_id) DO UPDATE SET count = count + 1, shiny_count = shiny_count + excluded.shiny_count',
    )
    .bind(day, pokemonId, shiny ? 1 : 0)
    .run()
