<script setup lang="ts">
import type { BaseStats } from '#shared/types/pokemon'

const props = defineProps<{ stats: BaseStats; filled: boolean }>()

const MAX_DISPLAYED_STAT = 200

const total = computed(() => statTotal(props.stats))
const bestStat = computed(() => strongestStat(props.stats))
const fillWidth = (value: number) => (props.filled ? `${Math.min(100, (value / MAX_DISPLAYED_STAT) * 100)}%` : '0')
</script>

<template>
  <dl class="stat-bars">
    <template v-for="key in STAT_KEYS" :key="key">
      <dt>{{ STAT_LABELS[key] }}</dt>
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
    <span>Total</span><span>{{ total }}</span>
  </p>
</template>

<style scoped lang="scss">
@use '../assets/scss/abstracts/functions' as *;

.stat-bars {
  display: grid;
  grid-template-columns: auto 3ch 1fr;
  gap: 7px 10px;
  align-items: center;
  font-size: font-size('sm');
  margin: 0;

  dt {
    color: color('text-muted');
    font-weight: weight('semibold');
  }
  dd {
    margin: 0;
    display: contents;
  }

  &__val {
    font-family: var(--font-mono), monospace;
    font-weight: weight('bold');
    text-align: right;
  }

  &__track {
    height: 9px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 99px;
    overflow: hidden;
  }

  &__fill {
    display: block;
    height: 100%;
    border-radius: 99px;
    width: 0;
    transition: width 1s ease('out');
    background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 50%, #fff));

    &--best {
      background: linear-gradient(90deg, var(--color-highlight), var(--color-highlight-soft));
    }
  }

  &__total {
    display: flex;
    justify-content: space-between;
    border-top: 1px dashed color('line');
    padding-top: space(2);
    margin: space(2) 0 0;
    font-weight: weight('bold');
    font-size: font-size('sm');

    span:last-child {
      font-family: var(--font-mono), monospace;
    }
  }
}
</style>
