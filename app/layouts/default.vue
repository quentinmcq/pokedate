<template>
  <AppHeader />
  <main id="contenu" class="site-main" tabindex="-1">
    <slot />
  </main>
  <AppFooter />
</template>

<style scoped lang="scss">
@use '../assets/scss/abstracts/tokens' as *;
@use '../assets/scss/abstracts/functions' as *;

.site-main {
  position: relative;
  z-index: z('base');
  flex: 1;
  width: 100%;
  max-width: $container-width;
  margin: 0 auto;
  padding: space(2) space(4) space(10);
}
</style>
