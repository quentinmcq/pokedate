<script setup lang="ts">
import type { DateParts } from '#shared/types/pokemon'

const props = defineProps<{ date: DateParts }>()

const chunks = computed(() => {
  const { d, m, y } = toDateInput(props.date)
  return [d, m, y].map((s) => ({ head: s.slice(0, -1), last: s.slice(-1) }))
})
const id = computed(() => pokemonIdFromDate(props.date))
const label = computed(() => {
  const [d, m, y] = chunks.value.map((c) => c.last)
  return `Derniers chiffres : ${d}, ${m} et ${y}, soit le Pokémon numéro ${id.value}`
})
</script>

<template>
  <p class="formula">
    <span class="visually-hidden">{{ label }}</span>
    <template v-for="(c, i) in chunks" :key="i">
      <span v-if="i" aria-hidden="true">/</span>
      <span class="formula__chunk" aria-hidden="true"
        ><span class="formula__head">{{ c.head }}</span
        ><b class="formula__digit">{{ c.last }}</b></span
      >
    </template>
    <span class="formula__arrow" aria-hidden="true">→</span>
    <span class="formula__num" aria-hidden="true">N° {{ padNumber(id, 3) }}</span>
    <span v-if="id === 1000" aria-hidden="true">(000 devient 1000 !)</span>
  </p>
</template>
