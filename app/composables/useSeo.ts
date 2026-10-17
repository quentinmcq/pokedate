export function useSiteUrl() {
  const { siteUrl } = useRuntimeConfig().public
  return (path = '/') => new URL(path, siteUrl).href
}

export function useSiteSeo() {
  const route = useRoute()
  const siteUrl = useSiteUrl()
  const canonical = computed(() => siteUrl(route.path))

  useHead({
    titleTemplate: (title) => (title ? `${title} · PokéDate` : 'PokéDate · Quel Pokémon se cache dans ta date ?'),
    link: [{ rel: 'canonical', href: canonical }],
  })
  useSeoMeta({
    ogSiteName: 'PokéDate',
    ogLocale: 'fr_FR',
    ogType: 'website',
    ogUrl: canonical,
    twitterCard: 'summary_large_image',
  })
}

interface PageSeo {
  title: MaybeRefOrGetter<string | undefined>
  ogTitle?: MaybeRefOrGetter<string | undefined>
  description: MaybeRefOrGetter<string>
  image?: MaybeRefOrGetter<string | undefined>
  imageAlt?: MaybeRefOrGetter<string | undefined>
  noindex?: MaybeRefOrGetter<boolean>
  jsonLd?: MaybeRefOrGetter<Record<string, unknown> | Record<string, unknown>[] | undefined>
}

export function usePageSeo(seo: PageSeo) {
  const siteUrl = useSiteUrl()
  const image = computed(() => {
    const path = toValue(seo.image)
    return path ? siteUrl(path) : siteUrl('/og-default.jpg')
  })

  useSeoMeta({
    title: () => toValue(seo.title),
    ogTitle: () => toValue(seo.ogTitle) ?? toValue(seo.title) ?? 'PokéDate · Quel Pokémon se cache dans ta date ?',
    description: () => toValue(seo.description),
    ogDescription: () => toValue(seo.description),
    ogImage: image,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageType: 'image/jpeg',
    ogImageAlt: () => toValue(seo.imageAlt) ?? 'PokéDate',
    twitterImage: image,
    robots: () => (toValue(seo.noindex) ? 'noindex, follow' : 'index, follow, max-image-preview:large'),
  })

  useHead({
    script: computed(() => {
      const data = toValue(seo.jsonLd)
      if (!data) return []
      return [{ type: 'application/ld+json', innerHTML: JSON.stringify(data).replace(/</g, '\\u003c') }]
    }),
  })
}
