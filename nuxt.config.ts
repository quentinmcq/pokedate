import { cpSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const GENERATED = fileURLToPath(new URL('./generated', import.meta.url))
const ONE_MONTH = 60 * 60 * 24 * 30

export default defineNuxtConfig({
  compatibilityDate: '2026-10-17',
  devtools: { enabled: true },

  modules: ['@nuxt/fonts', 'nuxt-security'],

  css: ['~/assets/scss/main.scss'],

  runtimeConfig: {
    public: {
      siteUrl: 'https://pokedate.quentin-macq.workers.dev',
      portfolioUrl: 'https://quentin-macq.dev',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#14162b' },
        { name: 'color-scheme', content: 'dark' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
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

  security: {
    nonce: true,
    sri: true,
    removeLoggers: false,
    rateLimiter: false,
    xssValidator: false,
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'base-uri': ["'none'"],
        'connect-src': ["'self'"],
        'font-src': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'img-src': ["'self'", 'data:'],
        'media-src': ["'self'"],
        'object-src': ["'none'"],
        'script-src': ["'self'", "'strict-dynamic'", "'nonce-{{nonce}}'"],
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
    '/sprites/**': {
      headers: { 'cache-control': `public, max-age=${ONE_MONTH}, stale-while-revalidate=${ONE_MONTH}` },
    },
    '/cries/**': { headers: { 'cache-control': `public, max-age=${ONE_MONTH}` } },
  },

  $development: {
    nitro: { publicAssets: [{ dir: GENERATED, baseURL: '/' }] },
  },

  hooks: {
    'nitro:init'(nitro) {
      nitro.hooks.hook('compiled', () => {
        if (nitro.options.dev) return
        if (!existsSync(GENERATED))
          throw new Error('Dossier generated/ absent : lance `bun run sprites` avant le build')
        cpSync(GENERATED, nitro.options.output.publicDir, { recursive: true })
      })
    },
  },

  nitro: {
    preset: 'cloudflare_module',
  },
})
