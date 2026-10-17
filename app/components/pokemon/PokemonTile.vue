<script setup lang="ts">
import type { PokemonSummary } from '#shared/types/pokemon'

const props = withDefaults(defineProps<{ pokemon: PokemonSummary; shiny?: boolean; discovered?: boolean }>(), {
  shiny: false,
  discovered: true,
})
const link = computed(() => ({ path: pokemonPath(props.pokemon), query: props.shiny ? { shiny: '1' } : {} }))
</script>

<template>
  <div v-if="!discovered" class="dex-cell dex-cell--unknown">
    <span class="dex-cell__unknown" aria-hidden="true">?</span>
    <span><span class="visually-hidden">Pas encore découvert : </span>#{{ padNumber(pokemon.id, 4) }}</span>
  </div>
  <NuxtLink v-else class="dex-cell" :class="{ 'dex-cell--shiny': shiny }" :to="link">
    <img loading="lazy" decoding="async" :src="spriteUrl(pokemon.id, shiny)" alt="" width="72" height="72" />
    <b>{{ pokemon.name }}</b>
    <span>#{{ padNumber(pokemon.id, 4) }}</span>
  </NuxtLink>
</template>

<style scoped lang="scss" src="./PokemonTile.scss" />
