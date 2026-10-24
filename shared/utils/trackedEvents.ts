export const TRACKED_EVENTS = [
  'reveal',
  'random',
  'duel',
  'tournament',
  'share',
  'transfer',
  'import',
  'publish',
  'install',
  'pokebrawl',
] as const

export type TrackedEvent = (typeof TRACKED_EVENTS)[number]

export const isTrackedEvent = (value: unknown): value is TrackedEvent =>
  typeof value === 'string' && (TRACKED_EVENTS as readonly string[]).includes(value)
