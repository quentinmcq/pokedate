<script setup lang="ts">
import type { BaseStats } from '#shared/types/pokemon'

const props = defineProps<{ stats: BaseStats; filled: boolean }>()

const MAX_DISPLAYED_STAT = 200

const { t } = useLocaleTools()

const total = computed(() => statTotal(props.stats))
const bestStat = computed(() => strongestStat(props.stats))
const fillWidth = (value: number) => (props.filled ? `${Math.min(100, (value / MAX_DISPLAYED_STAT) * 100)}%` : '0')
</script>

<template>
  <dl class="stat-bars">
    <template v-for="key in STAT_KEYS" :key="key">
      <dt>{{ t(`stats.${key}`) }}</dt>
      <dd>
        <span class="stat-bars__val">{{ stats[key] }}</span>
        <span class="stat-bars__track" aria-hidden="true"
          ><span
            class="stat-bars__fill"
            :class="{ 'stat-bars__fill--best': key === bestStat }"
            :style="{ width: fillWidth(stats[key]) }"
        /></span>
      </dd>
    </template>
  </dl>
  <p class="stat-bars__total">
    <span>{{ t('stats.total') }}</span
    ><span>{{ total }}</span>
  </p>
</template>

<style scoped lang="scss" src="./PokemonStatBars.scss" />
