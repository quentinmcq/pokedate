<script setup lang="ts">
import { encode } from 'uqr'

const props = withDefaults(defineProps<{ value: string; label: string; size?: number }>(), { size: 220 })

const QUIET_ZONE_MODULES = 2

const qrCode = computed(() => encode(props.value, { ecc: 'L', border: QUIET_ZONE_MODULES }))
const darkModulesPath = computed(() =>
  qrCode.value.data.flatMap((row, y) => row.flatMap((isDark, x) => (isDark ? [`M${x} ${y}h1v1h-1z`] : []))).join(''),
)
</script>

<template>
  <svg
    class="qr-code"
    role="img"
    :aria-label="label"
    :viewBox="`0 0 ${qrCode.size} ${qrCode.size}`"
    :width="size"
    :height="size"
    shape-rendering="crispEdges"
  >
    <rect :width="qrCode.size" :height="qrCode.size" fill="#fff" />
    <path :d="darkModulesPath" fill="#000" />
  </svg>
</template>

<style scoped lang="scss" src="./QrCode.scss" />
