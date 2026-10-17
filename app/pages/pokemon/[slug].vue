<script setup lang="ts">
definePageMeta({ key: (route) => route.path })

const route = useRoute()
const absoluteUrl = useAbsoluteUrl()

const POKEMON_SLUG_PATTERN = /^(\d{1,4})(?:-[a-z0-9-]*)?$/

const pokemonIdFromSlug = (slug: unknown) => {
  const match = POKEMON_SLUG_PATTERN.exec(typeof slug === 'string' ? slug : '')
  return match ? Number(match[1]) : null
}

const { data } = await usePokemonDetail(pokemonIdFromSlug(route.params.slug))
const pokemon = data.value
if (!pokemon)
  throw createError({ statusCode: 404, statusMessage: "Ce Pokémon n'existe pas (encore ?)", fatal: import.meta.client })

const canonicalPath = pokemonPath(pokemon)
if (route.path !== canonicalPath) await navigateTo({ path: canonicalPath, query: route.query }, { redirectCode: 301 })

const todayInParis = useState('today-in-paris', () => todayInTimeZone('Europe/Paris'))
const isShinyRequested = route.query.shiny === '1'
const isSharedLink = route.query.partage === '1'

usePageSeo({
  title: `${pokemon.name} (n° ${pokemon.id}) : types, stats, faiblesses et évolutions`,
  shareTitle: isSharedLink
    ? `Un ami est tombé sur ${pokemon.name} avec sa date ! Et toi ?`
    : `${pokemon.name}, n° ${pokemon.id}`,
  description: pokemonMetaDescription(pokemon),
  shareImagePath: shareImagePath(pokemon.id),
  shareImageAlt: pokemon.name,
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Pokémon', item: absoluteUrl('/pokemon') },
      { '@type': 'ListItem', position: 3, name: pokemon.name, item: absoluteUrl(canonicalPath) },
    ],
  },
})
</script>

<template>
  <div>
    <nav class="breadcrumb" aria-label="Fil d'Ariane">
      <ol>
        <li><NuxtLink to="/">Accueil</NuxtLink></li>
        <li><NuxtLink to="/pokemon">Pokémon</NuxtLink></li>
        <li aria-current="page">{{ pokemon.name }}</li>
      </ol>
    </nav>

    <HighlightBanner
      v-if="isSharedLink"
      to="/"
      :image-src="spriteUrl(pokemon.id)"
      icon="lucide:party-popper"
      :title="`Un·e ami·e est tombé·e sur ${pokemon.name} avec sa date !`"
      placement="top"
    >
      Et toi, quel Pokémon se cache dans ta date ? Touche pour le découvrir.
    </HighlightBanner>

    <PokemonCard :pokemon="pokemon" :shiny="isShinyRequested" heading-level="h1" />
    <PokemonDates :pokemon-id="pokemon.id" :pokemon-name="pokemon.name" :today="todayInParis" />

    <nav class="pager" aria-label="Pokémon voisins">
      <NuxtLink v-if="pokemon.previous" :to="pokemonPath(pokemon.previous)" rel="prev">
        <img :src="spriteUrl(pokemon.previous.id)" alt="" width="40" height="40" loading="lazy" />
        <span>← #{{ pokemon.previous.id }}</span> {{ pokemon.previous.name }}
      </NuxtLink>
      <NuxtLink v-if="pokemon.next" class="pager__next" :to="pokemonPath(pokemon.next)" rel="next">
        <img :src="spriteUrl(pokemon.next.id)" alt="" width="40" height="40" loading="lazy" />
        <span>#{{ pokemon.next.id }} →</span> {{ pokemon.next.name }}
      </NuxtLink>
    </nav>
  </div>
</template>

<style scoped lang="scss" src="./[slug].scss" />
