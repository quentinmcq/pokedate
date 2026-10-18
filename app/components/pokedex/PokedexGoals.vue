<script setup lang="ts">
import type { PokedexEntry } from '#shared/types/pokemon'

const props = defineProps<{ entries: readonly PokedexEntry[] | null | undefined }>()

const NEXT_GOALS_SHOWN = 2

const { t } = useLocaleTools()
const { goalTitle, goalDescription } = useGoalTexts()
const { goals, doneCount } = usePokedexGoals(() => props.entries)
const upcomingGoals = computed(() => nextGoals(goals.value, NEXT_GOALS_SHOWN))
</script>

<template>
  <section class="goals" aria-labelledby="goals-title">
    <h2 id="goals-title" class="goals__title">
      <Icon name="lucide:target" aria-hidden="true" /> {{ t('goals.sectionTitle') }}
    </h2>
    <p class="goals__summary">{{ t('goals.summary', { done: doneCount, total: goals.length }) }}</p>

    <ul class="goals__list">
      <li v-for="goal in upcomingGoals" :key="goalId(goal)">
        <PokedexGoal :goal="goal" :title="goalTitle(goal)" :description="goalDescription(goal)" />
      </li>
    </ul>

    <AccordionItem :question="t('goals.showAll', { count: goals.length })" group="pokedex-goals">
      <ul class="goals__list goals__list--all">
        <li v-for="goal in goals" :key="goalId(goal)">
          <PokedexGoal :goal="goal" :title="goalTitle(goal)" :description="goalDescription(goal)" />
        </li>
      </ul>
    </AccordionItem>
  </section>
</template>

<style scoped lang="scss" src="./PokedexGoals.scss" />
