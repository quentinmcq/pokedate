<script setup lang="ts">
const props = withDefaults(defineProps<{ size?: number }>(), { size: 30 })
const outline = computed(() => `${Math.max(3, Math.round(props.size / 10))}px`)
</script>

<template>
  <span class="ball" :style="{ '--ball-size': `${size}px`, '--ball-outline': outline }" aria-hidden="true" />
</template>

<style scoped lang="scss" src="./PokeBall.scss" />
