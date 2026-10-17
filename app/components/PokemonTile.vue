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

<style scoped lang="scss">
@use '../assets/scss/abstracts/functions' as *;
@use '../assets/scss/abstracts/mixins' as *;

.dex-cell {
  text-decoration: none;
  @include surface(2);
  border-radius: radius('lg');
  padding: 6px space(1) space(2);
  text-align: center;
  font-size: font-size('2xs');
  color: color('text-muted');
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  height: 100%;
  transition:
    transform duration('fast'),
    border-color duration('fast');

  &:hover {
    transform: translateY(-3px);
    border-color: color('highlight');
  }

  img {
    width: 72px;
    height: 72px;
    object-fit: contain;
    image-rendering: pixelated;
  }

  b {
    color: color('text');
    font-size: 0.78rem;
    @include truncate;
  }

  &--shiny {
    border-color: color('highlight');
  }

  &--unknown {
    opacity: 0.5;

    &:hover {
      transform: none;
      border-color: color('line');
    }
  }

  &__unknown {
    width: 72px;
    height: 72px;
    display: grid;
    place-items: center;
    font-size: 1.6rem;
    font-weight: weight('black');
    color: color('placeholder');
  }
}
</style>
