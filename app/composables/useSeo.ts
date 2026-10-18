const SITE_NAME = 'PokéDate'
const DEFAULT_SHARE_IMAGES = { fr: '/og-default.jpg', en: '/og-default-en.jpg' } as const

export function useAbsoluteUrl() {
  const { siteUrl } = useRuntimeConfig().public
  return (path = '/') => new URL(path, siteUrl).href
}

export function useSiteSeo() {
  const route = useRoute()
  const absoluteUrl = useAbsoluteUrl()
  const { t } = useLocaleTools()
  // Language, canonical link, hreflang alternates and og:locale all come from the i18n module.
  const localeHead = useLocaleHead({ dir: false, lang: true, seo: true })

  useHead({
    titleTemplate: (title) => (title ? `${title} · ${SITE_NAME}` : t('seo.defaultTitle')),
    htmlAttrs: { lang: () => localeHead.value.htmlAttrs.lang },
    link: () => localeHead.value.link,
    meta: () => localeHead.value.meta,
  })
  useSeoMeta({
    ogSiteName: SITE_NAME,
    ogType: 'website',
    ogUrl: () => absoluteUrl(route.path),
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
  const { t, locale } = useLocaleTools()
  const shareImageUrl = computed(() => absoluteUrl(toValue(seo.shareImagePath) ?? DEFAULT_SHARE_IMAGES[locale.value]))

  useSeoMeta({
    title: () => toValue(seo.title),
    ogTitle: () => toValue(seo.shareTitle) ?? toValue(seo.title) ?? t('seo.defaultTitle'),
    description: () => toValue(seo.description),
    ogDescription: () => toValue(seo.description),
    ogImage: shareImageUrl,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageType: 'image/jpeg',
    ogImageAlt: () => toValue(seo.shareImageAlt) ?? SITE_NAME,
    robots: () => (toValue(seo.noindex) ? 'noindex, follow' : 'index, follow, max-image-preview:large'),
  })

  useHead({
    script: computed(() => {
      const structuredData = toValue(seo.structuredData)
      return structuredData ? [{ type: 'application/ld+json', innerHTML: serializeJsonLd(structuredData) }] : []
    }),
  })
}
