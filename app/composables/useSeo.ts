const SITE_NAME = 'PokéDate'
const DEFAULT_TITLE = 'PokéDate · Quel Pokémon se cache dans ta date ?'
const DEFAULT_SHARE_IMAGE = '/og-default.jpg'

export function useAbsoluteUrl() {
  const { siteUrl } = useRuntimeConfig().public
  return (path = '/') => new URL(path, siteUrl).href
}

export function useSiteSeo() {
  const route = useRoute()
  const absoluteUrl = useAbsoluteUrl()
  const canonicalUrl = computed(() => absoluteUrl(route.path))

  useHead({
    titleTemplate: (title) => (title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE),
    link: [{ rel: 'canonical', href: canonicalUrl }],
  })
  useSeoMeta({
    ogSiteName: SITE_NAME,
    ogLocale: 'fr_FR',
    ogType: 'website',
    ogUrl: canonicalUrl,
    twitterCard: 'summary_large_image',
  })
}

type JsonLd = Record<string, unknown>

interface PageSeo {
  title: MaybeRefOrGetter<string | undefined>
  shareTitle?: MaybeRefOrGetter<string | undefined>
  description: MaybeRefOrGetter<string>
  shareImagePath?: MaybeRefOrGetter<string | undefined>
  shareImageAlt?: MaybeRefOrGetter<string | undefined>
  noindex?: MaybeRefOrGetter<boolean>
  structuredData?: MaybeRefOrGetter<JsonLd | JsonLd[] | undefined>
}

const serializeJsonLd = (data: JsonLd | JsonLd[]) => JSON.stringify(data).replace(/</g, '\\u003c')

export function usePageSeo(seo: PageSeo) {
  const absoluteUrl = useAbsoluteUrl()
  const shareImageUrl = computed(() => absoluteUrl(toValue(seo.shareImagePath) ?? DEFAULT_SHARE_IMAGE))

  useSeoMeta({
    title: () => toValue(seo.title),
    ogTitle: () => toValue(seo.shareTitle) ?? toValue(seo.title) ?? DEFAULT_TITLE,
    description: () => toValue(seo.description),
    ogDescription: () => toValue(seo.description),
    ogImage: shareImageUrl,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageType: 'image/jpeg',
    ogImageAlt: () => toValue(seo.shareImageAlt) ?? SITE_NAME,
    twitterImage: shareImageUrl,
    robots: () => (toValue(seo.noindex) ? 'noindex, follow' : 'index, follow, max-image-preview:large'),
  })

  useHead({
    script: computed(() => {
      const structuredData = toValue(seo.structuredData)
      return structuredData ? [{ type: 'application/ld+json', innerHTML: serializeJsonLd(structuredData) }] : []
    }),
  })
}
