<script setup lang="ts">
const route = useRoute()
const siteUrl = useSiteUrl()

// /pokemon/706-muplodocus (ou l'ancienne forme /pokemon/706)
const slug = computed(() => String(route.params.slug ?? ''))
const id = computed(() => {
  const m = /^(\d{1,4})(?:-[a-z0-9-]*)?$/.exec(slug.value)
  return m ? Number(m[1]) : null
})

const { data: pokemon } = await usePokemon(id)
if (!pokemon.value)
  throw createError({ statusCode: 404, statusMessage: "Ce Pokémon n'existe pas (encore ?)", fatal: import.meta.client })

// Une seule adresse par Pokémon : redirection permanente vers le chemin canonique
const canonicalPath = pokemonPath(pokemon.value)
if (route.path !== canonicalPath) await navigateTo({ path: canonicalPath, query: route.query }, { redirectCode: 301 })

// Le shiny vient de l'URL : appliqué après l'hydratation pour que le rendu serveur reste stable
const shiny = ref(false)
onMounted(() => (shiny.value = route.query.shiny === '1'))
const fromShare = computed(() => route.query.partage === '1')

const typesText = computed(() => (pokemon.value ? pokemon.value.types.map((t) => TYPES[t][0]).join(' et ') : ''))
const description = computed(() => {
  const p = pokemon.value!
  const intro = `${p.fr} (n° ${p.id}), ${p.genus.toLowerCase()} de type ${typesText.value}, génération ${GENS[p.gen]?.[0]}. `
  const text = intro + (p.descEn ? '' : p.desc)
  return text.length > 158 ? `${text.slice(0, 155).trimEnd()}…` : text
})

usePageSeo({
  title: () => `${pokemon.value!.fr} (n° ${pokemon.value!.id}) : types, stats, faiblesses et évolutions`,
  ogTitle: () =>
    fromShare.value
      ? `Un ami est tombé sur ${pokemon.value!.fr} avec sa date ! Et toi ?`
      : `${pokemon.value!.fr}, n° ${pokemon.value!.id}`,
  description,
  image: () => `/sprites/og/${pokemon.value!.id}.jpg`,
  imageAlt: () => pokemon.value!.fr,
  jsonLd: () => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: siteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Pokémon', item: siteUrl('/pokemon') },
      { '@type': 'ListItem', position: 3, name: pokemon.value!.fr, item: siteUrl(canonicalPath) },
    ],
  }),
})
</script>

<template>
  <div v-if="pokemon">
    <nav class="breadcrumb" aria-label="Fil d'Ariane">
      <ol>
        <li><NuxtLink to="/">Accueil</NuxtLink></li>
        <li><NuxtLink to="/pokemon">Pokémon</NuxtLink></li>
        <li aria-current="page">{{ pokemon.fr }}</li>
      </ol>
    </nav>

    <NuxtLink v-if="fromShare" class="banner banner--top" to="/">
      <img :src="miniUrl(pokemon.id)" alt="" width="64" height="64" />
      <div>
        <b>🎉 Un·e ami·e est tombé·e sur {{ pokemon.fr }} avec sa date&nbsp;!</b>
        <span>Et toi, quel Pokémon se cache dans ta date ? Touche pour le découvrir.</span>
      </div>
    </NuxtLink>

    <PokemonCard :key="pokemon.id" :pokemon="pokemon" :shiny="shiny" heading-level="h1" />

    <nav class="pager" aria-label="Pokémon voisins">
      <NuxtLink v-if="pokemon.prev" :to="pokemonPath(pokemon.prev)" rel="prev">
        <img :src="miniUrl(pokemon.prev.id)" alt="" width="40" height="40" loading="lazy" />
        <span>← #{{ pokemon.prev.id }}</span> {{ pokemon.prev.fr }}
      </NuxtLink>
      <NuxtLink v-if="pokemon.next" class="pager__next" :to="pokemonPath(pokemon.next)" rel="next">
        <img :src="miniUrl(pokemon.next.id)" alt="" width="40" height="40" loading="lazy" />
        <span>#{{ pokemon.next.id }} →</span> {{ pokemon.next.fr }}
      </NuxtLink>
    </nav>
  </div>
</template>
