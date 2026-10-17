// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },

  css: ['~/assets/scss/main.scss'],

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'PokéDate',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#14162b' },
        {
          name: 'description',
          content:
            "Entre une date, découvre ton Pokémon : le dernier chiffre du jour, du mois et de l'année donnent son numéro.",
        },
        { property: 'og:site_name', content: 'PokéDate' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=JetBrains+Mono:wght@500;700&display=swap',
        },
      ],
    },
  },

  routeRules: {
    // Les données ne changent qu'à la régénération du JSON
    '/api/**': { headers: { 'cache-control': 'public, max-age=3600, s-maxage=86400' } },
  },

  nitro: {
    preset: 'cloudflare_module',
  },
})
