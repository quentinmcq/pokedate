<script setup lang="ts">
import type { GoalProgress } from '#shared/utils/pokedexGoals'

const props = defineProps<{ goal: GoalProgress; title: string; description: string }>()

const { t } = useLocaleTools()
const progressWidth = computed(() => `${(props.goal.current / props.goal.target) * 100}%`)
</script>

<template>
  <div class="goal" :class="{ 'goal--done': goal.done }">
    <Icon :name="goal.done ? 'lucide:badge-check' : goal.icon" class="goal__icon" aria-hidden="true" />
    <div class="goal__body">
      <b class="goal__title">{{ title }}</b>
      <span class="goal__description">{{ description }}</span>
      <span
        class="goal__bar"
        role="progressbar"
        :aria-label="title"
        aria-valuemin="0"
        :aria-valuemax="goal.target"
        :aria-valuenow="goal.current"
        :aria-valuetext="
          goal.done ? t('goals.done') : t('goals.progress', { current: goal.current, target: goal.target })
        "
        ><span class="goal__fill" :style="{ width: progressWidth }"
      /></span>
      <span class="goal__count" aria-hidden="true">{{
        goal.done ? t('goals.done') : `${goal.current} / ${goal.target}`
      }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./PokedexGoal.scss" />
