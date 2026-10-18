<script setup lang="ts">
import type { PokemonTypes } from '#shared/types/pokemon'

const props = defineProps<{ types: PokemonTypes }>()

const { t } = useLocaleTools()
const matchups = computed(() => defensiveMatchups(props.types))
const groups = computed(() =>
  [
    { id: 'weaknesses', label: t('matchups.weakTo'), matchups: matchups.value.weaknesses },
    { id: 'resistances', label: t('matchups.resists'), matchups: matchups.value.resistances },
    { id: 'immunities', label: t('matchups.immuneTo'), matchups: matchups.value.immunities },
  ].filter((group) => group.matchups.length > 0),
)
</script>

<template>
  <div class="matchups">
    <div v-for="group in groups" :key="group.id" class="chip-list">
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

<style scoped lang="scss" src="./PokemonMatchups.scss" />
