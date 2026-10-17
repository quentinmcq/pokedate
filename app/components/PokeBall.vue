<script setup lang="ts">
const props = withDefaults(defineProps<{ size?: number }>(), { size: 30 })
const outline = computed(() => `${Math.max(3, Math.round(props.size / 10))}px`)
</script>

<template>
  <span class="ball" :style="{ '--ball-size': `${size}px`, '--ball-outline': outline }" aria-hidden="true" />
</template>

<style scoped lang="scss">
.ball {
  width: var(--ball-size);
  height: var(--ball-size);
  border-radius: 50%;
  border: var(--ball-outline) solid #111;
  position: relative;
  flex: none;
  background: linear-gradient(var(--color-brand) 0 45%, #111 45% 55%, #fff 55%);

  &::after {
    content: '';
    position: absolute;
    inset: 50% auto auto 50%;
    width: calc(var(--ball-size) * 0.3);
    height: calc(var(--ball-size) * 0.3);
    transform: translate(-50%, -50%);
    background: #fff;
    border: var(--ball-outline) solid #111;
    border-radius: 50%;
  }
}
</style>
