import type { TrackedEvent } from '#shared/utils/trackedEvents'
import type { D1Database } from './cloudflareBindings'

export const todayInParisIso = () => toIsoDate(todayInTimeZone('Europe/Paris'))

// The draws store UTC timestamps: today's ones start at Paris midnight, whatever the daylight saving time.
export function startOfParisDay(now = new Date()) {
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'shortOffset' })
    .formatToParts(now)
    .find((part) => part.type === 'timeZoneName')?.value
  const offsetHours = Number(offset?.replace('GMT', '') || 0)
  return Date.parse(`${toIsoDate(todayInTimeZone('Europe/Paris', now))}T00:00:00Z`) - offsetHours * 60 * 60 * 1000
}

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
