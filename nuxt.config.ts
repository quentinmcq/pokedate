import { createHash } from 'node:crypto'
import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ENGLISH_PAGE_PATHS } from './shared/utils/localizedPages'
import { POKEMON_TYPES } from './shared/utils/pokemon'
import { GOAL_ICONS } from './shared/utils/pokedexGoals'

const GENERATED = fileURLToPath(new URL('./generated', import.meta.url))
const SERVICE_WORKER_SOURCE = fileURLToPath(new URL('./service-worker/sw.js', import.meta.url))
const SITE_URL = 'https://pokedate.fr'
const ONE_MONTH = 60 * 60 * 24 * 30

// The service worker precaches every built script, style and font. Its content changes with each
// build, so browsers install the new version and it drops the previous cache.
function writeServiceWorker(publicDir: string) {
  const precachedAssets = readdirSync(join(publicDir, '_nuxt'), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => `/${relative(publicDir, join(entry.parentPath, entry.name)).split(sep).join('/')}`)
    .filter((path) => !path.startsWith('/_nuxt/builds/'))
    .toSorted()
  const source = readFileSync(SERVICE_WORKER_SOURCE, 'utf8')
  const buildId = createHash('sha256').update(source).update(precachedAssets.join()).digest('hex').slice(0, 12)
  const header = `const BUILD_ID = '${buildId}'\nconst PRECACHED_ASSETS = ${JSON.stringify(precachedAssets)}\n`
  writeFileSync(join(publicDir, 'sw.js'), header + source)
}

export default defineNuxtConfig({
  compatibilityDate: '2026-10-17',
  devtools: { enabled: true },

  modules: ['@nuxt/fonts', '@nuxt/icon', '@nuxtjs/i18n', 'nuxt-security'],

  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/scss/main.scss'],

  runtimeConfig: {
    public: {
      siteUrl: SITE_URL,
      portfolioUrl: 'https://quentin-macq.dev',
      cloudflareAnalyticsToken: '',
    },
  },

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'fr',
    baseUrl: SITE_URL,
    locales: [
      { code: 'fr', language: 'fr-FR', name: 'Français', file: 'fr.json' },
      { code: 'en', language: 'en-GB', name: 'English', file: 'en.json' },
    ],
    // No cookie and no redirect: each language has its own addresses, and a link switches between them.
    detectBrowserLanguage: false,
    customRoutes: 'config',
    pages: Object.fromEntries(Object.entries(ENGLISH_PAGE_PATHS).map(([page, path]) => [page, { en: path }])),
  },

  app: {
    head: {
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
      icons: [...Object.values(POKEMON_TYPES).map((type) => type.icon), ...GOAL_ICONS, 'lucide:badge-check'],
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
        'worker-src': ["'self'"],
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
        writeServiceWorker(nitro.options.output.publicDir)
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
