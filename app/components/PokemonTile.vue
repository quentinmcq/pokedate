<script setup lang="ts">
import type { PokemonSummary } from '#shared/types/pokemon'

const props = defineProps<{ pokemon: PokemonSummary; shiny?: boolean }>()
const link = computed(() => ({ path: pokemonPath(props.pokemon), query: props.shiny ? { shiny: '1' } : {} }))
</script>

<template>
  <NuxtLink class="dex-cell" :class="{ 'dex-cell--shiny': shiny }" :to="link">
    <img loading="lazy" decoding="async" :src="spriteUrl(pokemon.id, shiny)" alt="" width="72" height="72" />
    <b>{{ pokemon.name }}</b>
    <span>#{{ padNumber(pokemon.id, 4) }}</span>
  </NuxtLink>
</template>
