<script setup lang="ts">
const { accent } = usePageAccent()
const { toast } = useToast()

useHead({
  htmlAttrs: { style: computed(() => `--accent:${accent.value.primary};--accent-2:${accent.value.secondary}`) },
})
useSiteSeo()
</script>

<template>
  <a class="skip-link" href="#contenu">Aller au contenu</a>
  <NuxtLoadingIndicator color="#ffd23f" :height="3" />
  <canvas id="confetti" aria-hidden="true" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <div class="toast" :class="{ 'toast--visible': toast.visible }" role="status" aria-live="polite">
    {{ toast.message }}
  </div>
</template>

<style scoped lang="scss" src="./app.scss" />
