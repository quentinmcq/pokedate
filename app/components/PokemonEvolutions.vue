<script setup lang="ts">
import type { PokemonSummary } from '#shared/types/pokemon'

const props = defineProps<{ stages: PokemonSummary[][]; currentId: number }>()

const BRANCHING_THRESHOLD = 3
const hasManyBranches = computed(() => props.stages.some((stage) => stage.length > BRANCHING_THRESHOLD))
</script>

<template>
  <div class="evo" :class="{ 'evo--many': hasManyBranches }">
    <template v-for="(stage, stageIndex) in stages" :key="stageIndex">
      <span v-if="stageIndex > 0" class="evo__arrow" aria-hidden="true">→</span>
      <div class="evo__stage">
        <NuxtLink
          v-for="evolution in stage"
          :key="evolution.id"
          class="evo__link"
          :to="pokemonPath(evolution)"
          :aria-current="evolution.id === currentId ? 'page' : undefined"
        >
          <img loading="lazy" decoding="async" :src="spriteUrl(evolution.id)" alt="" width="56" height="56" />
          {{ evolution.name }}
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
