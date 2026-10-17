import type { PokedexEntry, TypeKey } from '#shared/types/pokemon'

export const normalizeSearchText = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

export function filterPokedexEntries<Entry extends PokedexEntry>(
  entries: Entry[],
  { query, type }: { query: string; type: TypeKey | null },
) {
  const normalizedQuery = normalizeSearchText(query).replace(/^(#|n°)\s*/, '')
  const searchedId = /^\d+$/.test(normalizedQuery) ? Number(normalizedQuery) : null
  return entries.filter(
    (entry) =>
      (!type || entry.types.includes(type)) &&
      (searchedId === null ? normalizeSearchText(entry.name).includes(normalizedQuery) : entry.id === searchedId),
  )
}
