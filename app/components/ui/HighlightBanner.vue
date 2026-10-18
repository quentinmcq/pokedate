<script setup lang="ts">
defineProps<{ to: string; imageSrc: string; icon: string; title: string; placement?: 'top' | 'bottom' }>()
</script>

<template>
  <NuxtLinkLocale class="banner" :class="{ 'banner--top': placement === 'top' }" :to="to">
    <img :src="imageSrc" alt="" width="64" height="64" loading="lazy" />
    <div>
      <b><Icon :name="icon" aria-hidden="true" /> {{ title }}</b>
      <span class="banner__text"><slot /></span>
    </div>
  </NuxtLinkLocale>
</template>

<style scoped lang="scss" src="./HighlightBanner.scss" />
