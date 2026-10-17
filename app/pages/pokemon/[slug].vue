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

<style scoped lang="scss">
@use '../../assets/scss/abstracts/tokens' as *;
@use '../../assets/scss/abstracts/functions' as *;
@use '../../assets/scss/abstracts/mixins' as *;

.breadcrumb {
  font-size: font-size('sm');
  color: color('text-muted');
  margin: space(4) 0 space(5);

  ol {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: space(2);
    padding: 0;
    margin: 0;
  }

  li + li::before {
    content: '›';
    margin-right: space(2);
    color: color('text-subtle');
  }

  a {
    color: color('text-muted');
  }
}

.pager {
  display: flex;
  justify-content: space-between;
  gap: space(3);
  margin-top: space(6);

  a {
    display: flex;
    align-items: center;
    gap: space(2);
    @include surface(2);
    border-radius: radius('pill');
    padding: space(2) space(4) space(2) space(2);
    text-decoration: none;
    font-weight: weight('semibold');
    min-height: $tap-target;
    transition: border-color duration('base');

    &:hover {
      border-color: color('highlight');
    }

    img {
      width: 40px;
      height: 40px;
      image-rendering: pixelated;
    }

    span {
      color: color('text-muted');
      font-family: var(--font-mono), monospace;
      font-size: font-size('xs');
    }
  }

  &__next {
    margin-left: auto;
    flex-direction: row-reverse;
    padding: space(2) space(2) space(2) space(4) !important;
  }
}
</style>
