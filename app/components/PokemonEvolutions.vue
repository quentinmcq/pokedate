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

<style scoped lang="scss">
@use '../assets/scss/abstracts/functions' as *;

.evo {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  &__stage {
    display: flex;
    flex-direction: column;
    gap: space(1);
  }

  &--many &__stage {
    flex-direction: row;
    flex-wrap: wrap;
    max-width: 100%;
  }

  &__arrow {
    color: color('text-muted');
    font-size: 1.1rem;
  }

  &__link {
    text-decoration: none;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid transparent;
    border-radius: radius('lg');
    padding: space(1) space(2) 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: font-size('2xs');
    font-weight: weight('semibold');
    color: color('text-muted');
    transition:
      border-color duration('base'),
      transform duration('base');

    &:hover {
      border-color: color('line');
      transform: translateY(-2px);
    }

    &[aria-current='page'] {
      border-color: color('highlight');
      color: color('text');
    }

    img {
      width: 56px;
      height: 56px;
      object-fit: contain;
      image-rendering: pixelated;
    }
  }
}
</style>
