<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <AppHeader />
  <main id="contenu" class="site-main" tabindex="-1">
    <ChallengeSwitch v-if="isSectionPath('challenges', route.path)" />
    <slot />
  </main>
  <AppFooter />
</template>

<style scoped lang="scss" src="./default.scss" />
