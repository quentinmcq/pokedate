import type { TrackedEvent } from '#shared/utils/trackedEvents'
import type { D1Database } from './cloudflareBindings'

export const incrementEventCount = (
  db: D1Database,
  name: TrackedEvent,
  day = toIsoDate(todayInTimeZone('Europe/Paris')),
) =>
  db
    .prepare(
      'INSERT INTO event_counts (day, name, count) VALUES (?, ?, 1) ON CONFLICT (day, name) DO UPDATE SET count = count + 1',
    )
    .bind(day, name)
    .run()
