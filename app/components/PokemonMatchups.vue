<script setup lang="ts">
import type { PokemonTypes } from '#shared/types/pokemon'

const props = defineProps<{ types: PokemonTypes }>()

const matchups = computed(() => defensiveMatchups(props.types))
const groups = computed(() =>
  [
    { label: 'Faible contre', matchups: matchups.value.weaknesses },
    { label: 'Résiste à', matchups: matchups.value.resistances },
    { label: 'Immunisé contre', matchups: matchups.value.immunities },
  ].filter((group) => group.matchups.length > 0),
)
</script>

<template>
  <div class="matchups">
    <div v-for="group in groups" :key="group.label" class="chip-list">
      <span class="matchups__label">{{ group.label }}</span>
      <TypeChip
        v-for="matchup in group.matchups"
        :key="matchup.type"
        :type="matchup.type"
        :multiplier="matchup.multiplier"
        small
      />
    </div>
  </div>
</template>
