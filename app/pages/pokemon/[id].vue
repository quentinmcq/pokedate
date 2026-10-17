<script setup lang="ts">
const route = useRoute()
const id = computed(() => Number(route.params.id))
const shiny = computed(() => route.query.shiny === '1')

const { data: pokemon, error } = await usePokemon(id)
if (error.value || !pokemon.value)
  throw createError({ statusCode: 404, statusMessage: "Ce Pokémon n'existe pas (encore ?)", fatal: true })

useSeoMeta({
  title: () => `${pokemon.value?.fr} #${id.value} · PokéDate`,
  ogTitle: () => `${pokemon.value?.fr} #${id.value}, ${pokemon.value?.genus}`,
  description: () => pokemon.value?.desc ?? '',
  ogDescription: () => pokemon.value?.desc ?? '',
  ogImage: () => artUrl(id.value, shiny.value),
})
</script>

<template>
  <section>
    <p class="explore-note">Exploration du Pokédex · <NuxtLink to="/">trouver le Pokémon de ma date</NuxtLink></p>
    <PokemonCard v-if="pokemon" :key="pokemon.id" :pokemon="pokemon" :shiny="shiny" />
  </section>
</template>
