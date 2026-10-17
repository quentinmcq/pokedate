<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ to: RouteLocationRaw; imageSrc: string; icon: string; title: string; placement?: 'top' | 'bottom' }>()
</script>

<template>
  <NuxtLink class="banner" :class="{ 'banner--top': placement === 'top' }" :to="to">
    <img :src="imageSrc" alt="" width="64" height="64" loading="lazy" />
    <div>
      <b><Icon :name="icon" aria-hidden="true" /> {{ title }}</b>
      <span class="banner__text"><slot /></span>
    </div>
  </NuxtLink>
</template>

<style scoped lang="scss" src="./HighlightBanner.scss" />
