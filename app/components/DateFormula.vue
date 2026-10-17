<script setup lang="ts">
import type { CalendarDate } from '#shared/types/pokemon'

const props = defineProps<{ date: CalendarDate }>()

const dateParts = computed(() => {
  const { day, month, year } = toDateFieldValue(props.date)
  return [day, month, year].map((part) => ({ leadingDigits: part.slice(0, -1), lastDigit: part.slice(-1) }))
})
const pokemonId = computed(() => pokemonIdFromDate(props.date))
const spokenFormula = computed(() => {
  const [dayDigit, monthDigit, yearDigit] = dateParts.value.map((part) => part.lastDigit)
  return `Derniers chiffres : ${dayDigit}, ${monthDigit} et ${yearDigit}, soit le Pokémon numéro ${pokemonId.value}`
})
</script>

<template>
  <p class="formula">
    <span class="visually-hidden">{{ spokenFormula }}</span>
    <template v-for="(part, index) in dateParts" :key="index">
      <span v-if="index > 0" aria-hidden="true">/</span>
      <span class="formula__chunk" aria-hidden="true"
        ><span class="formula__head">{{ part.leadingDigits }}</span
        ><b class="formula__digit">{{ part.lastDigit }}</b></span
      >
    </template>
    <span class="formula__arrow" aria-hidden="true">→</span>
    <span class="formula__num" aria-hidden="true">N° {{ padNumber(pokemonId, 3) }}</span>
    <span v-if="pokemonId === 1000" aria-hidden="true">(000 devient 1000 !)</span>
  </p>
</template>

<style scoped lang="scss">
@use '../assets/scss/abstracts/functions' as *;

.formula {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: space(3);
  flex-wrap: wrap;
  font-family: var(--font-mono), monospace;
  font-size: font-size('lg');
  color: color('text-muted');
  margin: space(8) 0 space(5);

  &__head {
    color: color('text-subtle');
  }

  &__digit {
    color: color('highlight');
    font-size: 1.5em;
    display: inline-block;
    animation: pop 0.5s backwards;
  }
  &__chunk:nth-of-type(2) &__digit {
    animation-delay: 0.12s;
  }
  &__chunk:nth-of-type(3) &__digit {
    animation-delay: 0.24s;
  }

  &__arrow {
    color: color('text');
  }

  &__num {
    color: color('text');
    background: rgba(255, 255, 255, 0.08);
    padding: space(1) space(3);
    border-radius: radius('md');
    font-weight: weight('bold');
  }
}
</style>
