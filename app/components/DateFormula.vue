<script setup lang="ts">
import type { DateParts } from '#shared/types/pokemon'

const props = defineProps<{ date: DateParts }>()

const chunks = computed(() => {
  const { d, m, y } = toDateInput(props.date)
  return [d, m, y].map((s) => ({ head: s.slice(0, -1), last: s.slice(-1) }))
})
const id = computed(() => pokemonIdFromDate(props.date))
</script>

<template>
  <div class="formula">
    <template v-for="(c, i) in chunks" :key="i">
      <span v-if="i">/</span>
      <span class="chunk"
        ><span>{{ c.head }}</span
        ><b>{{ c.last }}</b></span
      >
    </template>
    <span class="arrow">→</span>
    <span class="num">N° {{ padNumber(id, 3) }}</span>
    <span v-if="id === 1000">(000 devient 1000 !)</span>
  </div>
</template>
