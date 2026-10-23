<script setup lang="ts">
import type { TypeKey } from '#shared/types/pokemon'

const props = defineProps<{ type: TypeKey; small?: boolean; multiplier?: number }>()
const typeStyle = computed(() => POKEMON_TYPES[props.type])
const { t } = useLocaleTools()
</script>

<template>
  <span class="type-chip" :class="{ 'type-chip--sm': small }" :style="{ '--c': typeStyle.badgeColor }">
    <Icon :name="typeStyle.icon" class="type-chip__icon" aria-hidden="true" /> {{ t(`types.${type}`)
    }}<span v-if="multiplier !== undefined" class="type-chip__mult">{{ formatMultiplier(multiplier) }}</span>
  </span>
</template>

<style scoped lang="scss" src="./TypeChip.scss" />
