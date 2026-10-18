import type { PublicDraw, PublishedDraw } from '#shared/types/pokemon'
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
  bonus_pokemon_id: number | null
}

const pokemonName = (id: number) => findPokemon(id)?.name ?? `#${id}`

const toPublicDraw = (row: DrawRow): PublicDraw => ({
  id: row.id,
  pokemonId: row.pokemon_id,
  pokemonName: pokemonName(row.pokemon_id),
  shiny: row.shiny === 1,
  bonusPokemon: row.bonus_pokemon_id ? { id: row.bonus_pokemon_id, name: pokemonName(row.bonus_pokemon_id) } : null,
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

const toHex = (bytes: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')

// Only a hash is stored: a leaked database cannot be used to rename or remove someone else's draw.
const hashEditToken = async (editToken: string) =>
  toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(editToken)))

export const isEditToken = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{32}$/.test(value)

export async function publishDraw(
  db: D1Database,
  draw: { pokemonId: number; shiny: boolean; bonusPokemonId: number | null; nickname: string },
  now = Date.now(),
): Promise<PublishedDraw> {
  const editToken = toHex(crypto.getRandomValues(new Uint8Array(16)))
  const row = await db
    .prepare(
      'INSERT INTO draws (pokemon_id, shiny, bonus_pokemon_id, nickname, created_at, edit_token_hash) VALUES (?, ?, ?, ?, ?, ?) RETURNING *',
    )
    .bind(draw.pokemonId, draw.shiny ? 1 : 0, draw.bonusPokemonId, draw.nickname, now, await hashEditToken(editToken))
    .first<DrawRow>()
  await pruneStatement(db, now).run()
  if (!row) throw new Error('Draw insertion returned no row')
  return { draw: toPublicDraw(row), editToken }
}

export async function renameDraw(db: D1Database, drawId: number, editToken: string, nickname: string) {
  const { meta } = await db
    .prepare('UPDATE draws SET nickname = ? WHERE id = ? AND edit_token_hash = ?')
    .bind(nickname, drawId, await hashEditToken(editToken))
    .run()
  return meta.changes > 0
}

export async function removeDraw(db: D1Database, drawId: number, editToken: string) {
  const { meta } = await db
    .prepare('DELETE FROM draws WHERE id = ? AND edit_token_hash = ?')
    .bind(drawId, await hashEditToken(editToken))
    .run()
  return meta.changes > 0
}

export const purgeExpiredDraws = (db: D1Database, now = Date.now()) => pruneStatement(db, now).run()
