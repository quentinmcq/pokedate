<script setup lang="ts">
import type { CalendarDate } from '#shared/types/pokemon'

const props = defineProps<{ date: CalendarDate }>()
const { t } = useLocaleTools()

const dateParts = computed(() => {
  const { day, month, year } = toDateFieldValue(props.date)
  return [day, month, year].map((part) => ({ leadingDigits: part.slice(0, -1), lastDigit: part.slice(-1) }))
})
const pokemonId = computed(() => pokemonIdFromDate(props.date))
const spokenFormula = computed(() => {
  const [dayDigit, monthDigit, yearDigit] = dateParts.value.map((part) => part.lastDigit)
  return t('formula.spoken', { day: dayDigit!, month: monthDigit!, year: yearDigit!, number: pokemonId.value })
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
    <span class="formula__num" aria-hidden="true">{{ t('card.number', { number: padNumber(pokemonId, 3) }) }}</span>
    <span v-if="pokemonId === 1000" aria-hidden="true">{{ t('formula.thousand') }}</span>
  </p>
</template>

<style scoped lang="scss" src="./DateFormula.scss" />
