<script setup lang="ts">
import type { TypeKey } from '#shared/types/pokemon'

const props = defineProps<{ type: TypeKey; small?: boolean; multiplier?: number }>()
const typeStyle = computed(() => POKEMON_TYPES[props.type])
</script>

<template>
  <span
    class="type-chip"
    :class="{ 'type-chip--sm': small }"
    :style="{ '--c': typeStyle.color, '--ink': typeStyle.textColor }"
  >
    <Icon :name="typeStyle.icon" class="type-chip__icon" aria-hidden="true" /> {{ typeStyle.label
    }}<span v-if="multiplier !== undefined" class="type-chip__mult">{{ formatMultiplier(multiplier) }}</span>
  </span>
</template>

<style scoped lang="scss">
@use '../assets/scss/abstracts/functions' as *;

.type-chip {
  --c: #888;
  --ink: #fff;
  background: var(--c);
  color: var(--ink);
  padding: 5px 14px 5px 10px;
  border-radius: radius('pill');
  font-weight: weight('bold');
  font-size: font-size('sm');
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &--sm {
    font-size: 0.75rem;
    padding: 3px 9px 3px 7px;
  }

  &__mult {
    font-family: var(--font-mono), monospace;
    font-size: 0.7rem;
    background: rgba(20, 22, 43, 0.85);
    color: #fff;
    padding: 1px 5px;
    border-radius: 6px;
    margin-left: 2px;
  }
}
</style>
