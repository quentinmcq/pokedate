<script setup lang="ts">
import type { DuelSide } from '#shared/utils/duel'
import type { PokemonDetail } from '#shared/types/pokemon'

defineProps<{
  pokemon: PokemonDetail
  playerName: string
  shiny: boolean
  side: DuelSide
  result: 'win' | 'lose' | 'draw'
}>()
</script>

<template>
  <div
    class="fighter"
    :class="[
      side === 'A' ? 'fighter--left' : 'fighter--right',
      { 'fighter--win': result === 'win', 'fighter--lose': result === 'lose' },
    ]"
    :style="{ '--accent': typeColor(pokemon.types[0]) }"
  >
    <Icon v-if="result === 'win'" name="lucide:crown" class="fighter__crown" aria-hidden="true" />
    <img :src="artworkUrl(pokemon.id, shiny)" :alt="pokemon.name" width="160" height="160" />
    <div class="fighter__player">{{ playerName }}</div>
    <h2 class="fighter__name">
      <NuxtLink :to="pokemonPath(pokemon)">{{ pokemon.name }}</NuxtLink
      ><Icon v-if="shiny" name="lucide:sparkles" class="fighter__shiny" aria-label="shiny" />
      <small>#{{ pokemon.id }}</small>
    </h2>
    <div class="chip-list"><TypeChip v-for="type in pokemon.types" :key="type" :type="type" small /></div>
    <div class="fighter__power">
      Total stats <b>{{ statTotal(pokemon.stats) }}</b> · Vitesse <b>{{ pokemon.stats.speed }}</b>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./DuelFighter.scss" />
