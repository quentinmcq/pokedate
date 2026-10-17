<script setup lang="ts">
import type { TypeKey } from '#shared/types/pokemon'

defineProps<{ type: TypeKey; small?: boolean; mult?: number }>()
</script>

<template>
  <span
    class="type-chip"
    :class="{ 'type-chip--sm': small }"
    :style="{ '--c': TYPES[type][1], '--ink': TYPES[type][3] }"
  >
    <span aria-hidden="true">{{ TYPES[type][2] }}</span> {{ TYPES[type][0]
    }}<span v-if="mult !== undefined" class="type-chip__mult">{{ multLabel(mult) }}</span>
  </span>
</template>
