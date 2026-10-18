import { cpSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { POKEMON_TYPES } from './shared/utils/pokemon'

const GENERATED = fileURLToPath(new URL('./generated', import.meta.url))
const ONE_MONTH = 60 * 60 * 24 * 30

export default defineNuxtConfig({
  compatibilityDate: '2026-10-17',
  devtools: { enabled: true },

  modules: ['@nuxt/fonts', '@nuxt/icon', 'nuxt-security'],

  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/scss/main.scss'],

  runtimeConfig: {
    public: {
      siteUrl: 'https://pokedate.fr',
      portfolioUrl: 'https://quentin-macq.dev',
      cloudflareAnalyticsToken: '',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#14162b' },
        { name: 'apple-mobile-web-app-title', content: 'PokéDate' },
        { name: 'color-scheme', content: 'dark' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  fonts: {
    defaults: { subsets: ['latin', 'latin-ext'] },
    families: [
      { name: 'Bricolage Grotesque', provider: 'google', weights: [400, 600, 800], global: true },
      { name: 'JetBrains Mono', provider: 'google', weights: [500, 700], global: true },
    ],
  },

  icon: {
    mode: 'svg',
    provider: 'none',
    serverBundle: false,
    fallbackToApi: false,
    clientBundle: {
      scan: true,
      icons: Object.values(POKEMON_TYPES).map((type) => type.icon),
    },
  },

  security: {
    nonce: true,
    sri: true,
    removeLoggers: false,
    // The in-memory limiter is per isolate on Workers: rate limiting belongs to Cloudflare.
    rateLimiter: false,
    // Vue already escapes rendered text; the validator would reject legitimate player names.
    xssValidator: false,
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'base-uri': ["'none'"],
        'connect-src': ["'self'", 'https://cloudflareinsights.com'],
        'font-src': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'img-src': ["'self'", 'data:'],
        'media-src': ["'self'"],
        'object-src': ["'none'"],
        'script-src': ["'self'", 'https://static.cloudflareinsights.com', "'strict-dynamic'", "'nonce-{{nonce}}'"],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'upgrade-insecure-requests': true,
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: 'strict-origin-when-cross-origin',
      strictTransportSecurity: { maxAge: 31536000, includeSubdomains: true },
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
        payment: [],
        usb: [],
        'display-capture': [],
        fullscreen: [],
      },
    },
  },

  routeRules: {
    '/api/**': { headers: { 'cache-control': 'public, max-age=3600, s-maxage=86400' } },
    '/api/draws': { headers: { 'cache-control': 'no-store' } },
    '/api/activity': { headers: { 'cache-control': 'public, max-age=60' } },
    '/sprites/**': {
      headers: { 'cache-control': `public, max-age=${ONE_MONTH}, stale-while-revalidate=${ONE_MONTH}` },
    },
    '/cries/**': { headers: { 'cache-control': `public, max-age=${ONE_MONTH}` } },
  },

  $development: {
    nitro: { publicAssets: [{ dir: GENERATED, baseURL: '/' }] },
    vite: { optimizeDeps: { include: ['@vue/devtools-core', '@vue/devtools-kit'] } },
  },

  hooks: {
    // nuxt-security registers these handlers even when disabled; dropping them keeps the xss
    // library and two no-op middlewares out of the Worker.
    'nitro:config'(nitroConfig) {
      const disabledSecurityHandlers = /nuxt-security\/dist\/runtime\/server\/middleware\/(xssValidator|rateLimiter)/
      nitroConfig.handlers = nitroConfig.handlers?.filter(
        (handler) => !disabledSecurityHandlers.test(handler?.handler ?? ''),
      )
    },
    // generated/ holds 6,000+ files: copying it after the Worker is compiled keeps Nitro from
    // inlining their manifest in the bundle. hook() adds to the Cloudflare preset's own
    // 'compiled' hook (which writes _headers) instead of replacing it.
    'nitro:init'(nitro) {
      nitro.hooks.hook('compiled', () => {
        if (nitro.options.dev) return
        if (!existsSync(GENERATED))
          throw new Error('Dossier generated/ absent : lance `bun run sprites` avant le build')
        cpSync(GENERATED, nitro.options.output.publicDir, { recursive: true })
      })
    },
  },

  typescript: {
    nodeTsConfig: {
      include: [
        '../playwright.config.ts',
        '../vitest.config.ts',
        '../e2e/**/*',
        '../test/unit/**/*',
        '../scripts/**/*',
      ],
      compilerOptions: { types: ['node'], paths: { '#shared': ['../shared'], '#shared/*': ['../shared/*'] } },
    },
  },

  nitro: {
    preset: 'cloudflare_module',
    experimental: { tasks: true },
    scheduledTasks: { '0 4 * * *': ['draws:purge'] },
  },
})
