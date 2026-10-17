import type { Discoveries, Discovery } from '~/composables/usePokedex'

export const TRANSFER_HASH_KEY = 'transfert'

const FORMAT_VERSION = '1'
const BITS_PER_POKEMON = 2
const POKEMON_PER_BYTE = 8 / BITS_PER_POKEMON
const STATE_MASK = 0b11
const BASE64URL_PATTERN = /^[\w-]*$/

const TransferState = { Unknown: 0, Seen: 1, Caught: 2, CaughtShiny: 3 } as const

const stateOf = ({ caught, shiny }: Discovery) => {
  if (!caught) return TransferState.Seen
  return shiny ? TransferState.CaughtShiny : TransferState.Caught
}

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')

const fromBase64Url = (text: string) =>
  Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), (character) => character.charCodeAt(0))

export function encodeDiscoveries(discoveries: Discoveries) {
  const bytes = new Uint8Array(Math.ceil(POKEMON_COUNT / POKEMON_PER_BYTE))
  for (const [key, discovery] of Object.entries(discoveries)) {
    const index = Number(key) - 1
    if (!Number.isInteger(index) || index < 0 || index >= POKEMON_COUNT) continue
    bytes[Math.floor(index / POKEMON_PER_BYTE)]! |=
      stateOf(discovery) << ((index % POKEMON_PER_BYTE) * BITS_PER_POKEMON)
  }
  let usedLength = bytes.length
  while (usedLength > 0 && bytes[usedLength - 1] === 0) usedLength--
  return `${FORMAT_VERSION}.${toBase64Url(bytes.subarray(0, usedLength))}`
}

export function decodeDiscoveries(code: string): Discoveries | null {
  const [version, payload = ''] = code.split('.')
  if (version !== FORMAT_VERSION || !BASE64URL_PATTERN.test(payload)) return null
  let bytes: Uint8Array
  try {
    bytes = fromBase64Url(payload)
  } catch {
    return null
  }
  const discoveries: Discoveries = {}
  for (let index = 0; index < Math.min(bytes.length * POKEMON_PER_BYTE, POKEMON_COUNT); index++) {
    const state =
      (bytes[Math.floor(index / POKEMON_PER_BYTE)]! >> ((index % POKEMON_PER_BYTE) * BITS_PER_POKEMON)) & STATE_MASK
    if (state === TransferState.Unknown) continue
    discoveries[index + 1] = { caught: state !== TransferState.Seen, shiny: state === TransferState.CaughtShiny }
  }
  return discoveries
}
