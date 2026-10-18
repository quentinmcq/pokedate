<script setup lang="ts">
definePageMeta({ key: (route) => route.path })

const route = useRoute()
const absoluteUrl = useAbsoluteUrl()
const { t, locale, translate } = useLocaleTools()
const localePath = useLocalePath()
const setI18nParams = useSetI18nParams()

const POKEMON_SLUG_PATTERN = /^(\d{1,4})(?:-[a-z0-9-]*)?$/

const pokemonIdFromSlug = (slug: unknown) => {
  const match = POKEMON_SLUG_PATTERN.exec(typeof slug === 'string' ? slug : '')
  return match ? Number(match[1]) : null
}

const { data } = await usePokemonDetail(pokemonIdFromSlug(route.params.slug))
const pokemon = data.value
if (!pokemon) throw createError({ statusCode: 404, message: t('pokemonPage.notFound'), fatal: import.meta.client })

const canonicalPath = localePath(pokemonPath(pokemon))
if (route.path !== canonicalPath) await navigateTo({ path: canonicalPath, query: route.query }, { redirectCode: 301 })

// The language switch needs the slug of the other language, where the Pokémon has another name.
const otherLocale = locale.value === 'fr' ? 'en' : 'fr'
setI18nParams({ [otherLocale]: { slug: pokemonSlug({ id: pokemon.id, name: pokemon.otherLanguageName }) } })

const todayInParis = useState('today-in-paris', () => todayInTimeZone('Europe/Paris'))
const isShinyRequested = route.query.shiny === '1'
const isSharedLink = route.query.partage === '1'

usePageSeo({
  title: t('pokemonPage.seoTitle', { name: pokemon.name, id: pokemon.id }),
  shareTitle: isSharedLink
    ? t('pokemonPage.sharedTitle', { name: pokemon.name })
    : t('pokemonPage.shareTitle', { name: pokemon.name, id: pokemon.id }),
  description: pokemonMetaDescription(translate, pokemon),
  shareImagePath: shareImagePath(pokemon.id, locale.value),
  shareImageAlt: pokemon.name,
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('pokemonPage.home'), item: absoluteUrl(localePath('/')) },
      { '@type': 'ListItem', position: 2, name: 'Pokémon', item: absoluteUrl(localePath('/pokemon')) },
      { '@type': 'ListItem', position: 3, name: pokemon.name, item: absoluteUrl(canonicalPath) },
    ],
  },
})
</script>

<template>
  <div>
    <nav class="breadcrumb" :aria-label="t('pokemonPage.breadcrumb')">
      <ol>
        <li>
          <NuxtLinkLocale to="/">{{ t('pokemonPage.home') }}</NuxtLinkLocale>
        </li>
        <li><NuxtLinkLocale to="/pokemon">Pokémon</NuxtLinkLocale></li>
        <li aria-current="page">{{ pokemon.name }}</li>
      </ol>
    </nav>

    <HighlightBanner
      v-if="isSharedLink"
      to="/"
      :image-src="spriteUrl(pokemon.id)"
      icon="lucide:party-popper"
      :title="t('pokemonPage.sharedBannerTitle', { name: pokemon.name })"
      placement="top"
    >
      {{ t('pokemonPage.sharedBannerText') }}
    </HighlightBanner>

    <PokemonCard :pokemon="pokemon" :shiny="isShinyRequested" heading-level="h1" />
    <PokemonDates :pokemon-id="pokemon.id" :pokemon-name="pokemon.name" :today="todayInParis" />

    <nav class="pager" :aria-label="t('pokemonPage.neighbours')">
      <NuxtLinkLocale v-if="pokemon.previous" :to="pokemonPath(pokemon.previous)" rel="prev">
        <img :src="spriteUrl(pokemon.previous.id)" alt="" width="40" height="40" loading="lazy" />
        <span class="pager__text"
          ><span class="pager__number">← #{{ pokemon.previous.id }}</span
          ><b class="pager__name">{{ pokemon.previous.name }}</b></span
        >
      </NuxtLinkLocale>
      <NuxtLinkLocale v-if="pokemon.next" class="pager__next" :to="pokemonPath(pokemon.next)" rel="next">
        <img :src="spriteUrl(pokemon.next.id)" alt="" width="40" height="40" loading="lazy" />
        <span class="pager__text"
          ><span class="pager__number">#{{ pokemon.next.id }} →</span
          ><b class="pager__name">{{ pokemon.next.name }}</b></span
        >
      </NuxtLinkLocale>
    </nav>
  </div>
</template>

<style scoped lang="scss" src="./[slug].scss" />
