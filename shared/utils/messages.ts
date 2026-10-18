export type MessageParams = Record<string, string | number>

export interface Message {
  key: string
  params?: MessageParams
}

export type Translate = (key: string, params?: MessageParams) => string

type MessageTree = { [key: string]: string | MessageTree }

const lookUp = (messages: MessageTree, key: string) =>
  key
    .split('.')
    .reduce<string | MessageTree | undefined>(
      (node, part) => (node && typeof node === 'object' ? node[part] : undefined),
      messages,
    )

// Covers the part of the vue-i18n syntax the shared texts use: {name} placeholders and {'literal'} escapes.
export const createTranslator =
  (messages: MessageTree): Translate =>
  (key, params = {}) => {
    const template = lookUp(messages, key)
    if (typeof template !== 'string') return key
    return template.replace(/\{\s*(?:'([^']*)'|(\w+))\s*\}/g, (_, literal: string | undefined, name: string) =>
      literal !== undefined ? literal : String(params[name] ?? ''),
    )
  }
