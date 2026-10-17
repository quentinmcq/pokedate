import type { H3Event } from 'h3'

export interface D1PreparedStatement {
  bind: (...values: unknown[]) => D1PreparedStatement
  all: <Row>() => Promise<{ results: Row[] }>
  first: <Row>() => Promise<Row | null>
  run: () => Promise<unknown>
}

export interface D1Database {
  prepare: (query: string) => D1PreparedStatement
  batch: (statements: D1PreparedStatement[]) => Promise<unknown>
}

interface RateLimiter {
  limit: (options: { key: string }) => Promise<{ success: boolean }>
}

export interface PokedateBindings {
  DB?: D1Database
  PUBLISH_RATE_LIMITER?: RateLimiter
}

type ContextWithCloudflare = { cloudflare?: { env?: PokedateBindings } }

export const bindingsFromContext = (context: unknown): PokedateBindings =>
  (context as ContextWithCloudflare | undefined)?.cloudflare?.env ?? {}

export const cloudflareBindings = (event: H3Event) => bindingsFromContext(event.context)
