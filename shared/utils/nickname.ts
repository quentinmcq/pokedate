import type { Message } from './messages'

export const NICKNAME_LENGTH = { min: 2, max: 20 } as const

const ALLOWED_CHARACTERS = /^[\p{L}\p{N} '_-]+$/u

const LOOKALIKE_LETTERS: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
}

// Short words are only matched as whole words, so first names such as "Constance" stay allowed.
const BLOCKED_WORDS = ['con', 'cons', 'pd', 'fdp', 'ntm', 'tg', 'ass', 'cul', 'sex']
const BLOCKED_FRAGMENTS = [
  'connard',
  'connasse',
  'salop',
  'putain',
  'pute',
  'encul',
  'nique',
  'niquer',
  'batard',
  'bite',
  'couille',
  'chatte',
  'branl',
  'enfoir',
  'pede',
  'tapette',
  'gouine',
  'negre',
  'negro',
  'bougnoul',
  'youpin',
  'nazi',
  'hitler',
  'porn',
  'fuck',
  'shit',
  'bitch',
  'cunt',
  'nigg',
  'fagg',
  'whore',
  'dick',
  'pussy',
  'penis',
  'viagra',
  'casino',
]

const normalized = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[0134578]/g, (digit) => LOOKALIKE_LETTERS[digit] ?? digit)

export const ANONYMOUS_NICKNAME = 'Anonyme'

export const cleanNickname = (value: unknown) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '')

export type NicknameCheck = { ok: true; nickname: string } | { ok: false; error: Message }

const invalid = (key: string): NicknameCheck => ({ ok: false, error: { key: `nicknameErrors.${key}` } })

export function checkNickname(value: unknown): NicknameCheck {
  const nickname = cleanNickname(value)
  if (!nickname) return { ok: true, nickname: ANONYMOUS_NICKNAME }
  if (nickname.length < NICKNAME_LENGTH.min) return invalid('tooShort')
  if (nickname.length > NICKNAME_LENGTH.max) return invalid('tooLong')
  if (!ALLOWED_CHARACTERS.test(nickname)) return invalid('characters')
  const words = normalized(nickname).split(/[\s'_-]+/)
  const spelledOutWord = words.filter((word) => word.length === 1).join('')
  const isBlocked =
    words.some((word) => BLOCKED_WORDS.includes(word)) ||
    [...words, spelledOutWord].some((word) => BLOCKED_FRAGMENTS.some((fragment) => word.includes(fragment)))
  if (isBlocked) return invalid('blocked')
  return { ok: true, nickname }
}
