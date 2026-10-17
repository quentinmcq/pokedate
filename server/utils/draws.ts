import type { PublicDraw } from '#shared/types/pokemon'
import type { D1Database } from './cloudflareBindings'

export const DRAWS_SHOWN = 50
export const DRAW_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000
export const NICKNAME_HOURLY_LIMIT = 5
const ONE_HOUR_MS = 60 * 60 * 1000

interface DrawRow {
  id: number
  pokemon_id: number
  shiny: number
  nickname: string
  created_at: number
}

const toPublicDraw = (row: DrawRow): PublicDraw => ({
  id: row.id,
  pokemonId: row.pokemon_id,
  pokemonName: findPokemon(row.pokemon_id)?.name ?? `#${row.pokemon_id}`,
  shiny: row.shiny === 1,
  nickname: row.nickname,
  createdAt: new Date(row.created_at).toISOString(),
})

export async function listRecentDraws(db: D1Database, now = Date.now()) {
  const { results } = await db
    .prepare('SELECT * FROM draws WHERE created_at >= ? ORDER BY id DESC LIMIT ?')
    .bind(now - DRAW_LIFETIME_MS, DRAWS_SHOWN)
    .all<DrawRow>()
  return results.map(toPublicDraw)
}

export async function countRecentDrawsOfNickname(db: D1Database, nickname: string, now = Date.now()) {
  const row = await db
    .prepare('SELECT COUNT(*) AS count FROM draws WHERE nickname = ? COLLATE NOCASE AND created_at >= ?')
    .bind(nickname, now - ONE_HOUR_MS)
    .first<{ count: number }>()
  return row?.count ?? 0
}

const pruneStatement = (db: D1Database, now: number) =>
  db
    .prepare('DELETE FROM draws WHERE created_at < ? OR id NOT IN (SELECT id FROM draws ORDER BY id DESC LIMIT ?)')
    .bind(now - DRAW_LIFETIME_MS, DRAWS_SHOWN)

export async function publishDraw(
  db: D1Database,
  draw: { pokemonId: number; shiny: boolean; nickname: string },
  now = Date.now(),
) {
  const row = await db
    .prepare('INSERT INTO draws (pokemon_id, shiny, nickname, created_at) VALUES (?, ?, ?, ?) RETURNING *')
    .bind(draw.pokemonId, draw.shiny ? 1 : 0, draw.nickname, now)
    .first<DrawRow>()
  await pruneStatement(db, now).run()
  if (!row) throw new Error('Draw insertion returned no row')
  return toPublicDraw(row)
}

export const purgeExpiredDraws = (db: D1Database, now = Date.now()) => pruneStatement(db, now).run()
