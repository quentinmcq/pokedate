<script setup lang="ts">
const { accent } = useAccent()
const { toast } = useToast()

useHead({
  htmlAttrs: { style: computed(() => `--accent:${accent.value[0]};--accent-2:${accent.value[1]}`) },
})
useSiteSeo()
</script>

<template>
  <a class="skip-link" href="#contenu">Aller au contenu</a>
  <NuxtLoadingIndicator color="#ffd23f" :height="3" />
  <canvas id="confetti" aria-hidden="true" />
  <AppHeader />
  <main id="contenu" class="site-main" tabindex="-1">
    <NuxtPage />
  </main>
  <AppFooter />
  <div class="toast" :class="{ 'toast--visible': toast.visible }" role="status" aria-live="polite">{{ toast.msg }}</div>
</template>
