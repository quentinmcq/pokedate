<script setup lang="ts">
import type { TypeKey } from '#shared/types/pokemon'

defineProps<{ type: TypeKey; small?: boolean; mult?: number }>()
</script>

<template>
  <span class="type" :class="{ sm: small }" :style="{ '--c': TYPES[type][1] }">
    {{ TYPES[type][2] }} {{ TYPES[type][0] }}<span v-if="mult !== undefined" class="mult">{{ multLabel(mult) }}</span>
  </span>
</template>
