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

<style scoped lang="scss">
@use '../assets/scss/abstracts/functions' as *;

.banner {
  margin-top: space(5);
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 18px;
  width: 100%;
  text-align: left;
  text-decoration: none;
  color: color('text');
  background: linear-gradient(110deg, #2b1957, #3c1e6e 50%, #172a5e);
  border: 1px solid color('mystic');
  box-shadow: 0 0 40px -10px color('mystic');
  animation: rise 0.6s 0.4s backwards;

  img {
    width: 64px;
    height: 64px;
    object-fit: contain;
    filter: drop-shadow(0 0 10px #b9a6ff);
    flex: none;
  }

  b {
    display: block;
    font-size: font-size('lg');
  }

  &__text {
    color: color('mystic-soft');
    font-size: font-size('sm');
  }

  &--top {
    margin: 0 0 space(5);
    animation-delay: 0s;
  }
}
</style>
