// What search engines read about the home page: the site, the app and its questions and answers.
export function useHomeStructuredData() {
  const { t, locale } = useLocaleTools()
  const absoluteUrl = useAbsoluteUrl()
  const localePath = useLocalePath()
  const { portfolioUrl } = useRuntimeConfig().public

  return () => [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'PokéDate',
      // Spellings people type without the accent, so that search engines tie them to this site.
      alternateName: ['PokeDate', 'Pokedate', 'Poke Date'],
      url: absoluteUrl(localePath('/')),
      inLanguage: LOCALE_TAGS[locale.value],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'PokéDate',
      url: absoluteUrl(localePath('/')),
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: t('home.anyOperatingSystem'),
      inLanguage: LOCALE_TAGS[locale.value],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      author: { '@type': 'Person', name: 'Quentin Macq', url: portfolioUrl },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: HOME_FAQ_KEYS.map((key) => ({
        '@type': 'Question',
        name: t(`faq.${key}.question`),
        acceptedAnswer: { '@type': 'Answer', text: t(`faq.${key}.answer`) },
      })),
    },
  ]
}
