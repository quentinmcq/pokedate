import data from '../data/pokemon.json'
import type { DexEntry, Pokemon, PokemonDetail } from '#shared/types/pokemon'

const POKEMON = data.pokemon as Pokemon[]
const CHAINS = data.chains as number[][][]

export const pokemonCount = POKEMON.length

export function findPokemon(id: number): PokemonDetail | null {
  const p = POKEMON[id - 1]
  if (!p) return null
  const { evo, ...rest } = p
  const stages = CHAINS[evo] ?? [[p.id]]
  return {
    ...rest,
    chain: stages.map((s) => s.map((eid) => ({ id: eid, fr: POKEMON[eid - 1]?.fr ?? `#${eid}` }))),
  }
}

let dexList: DexEntry[] | undefined
export const getDexList = () => (dexList ??= POKEMON.map(({ id, fr, types }) => ({ id, fr, types })))
