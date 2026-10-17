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

<style scoped lang="scss">
@use './assets/scss/abstracts/functions' as *;

.toast {
  position: fixed;
  left: 50%;
  bottom: space(6);
  transform: translate(-50%, calc(100% + 40px));
  background: color('text');
  color: color('on-light');
  padding: space(3) space(5);
  border-radius: radius('pill');
  font-weight: weight('bold');
  z-index: z('toast');
  max-width: calc(100% - 32px);
  visibility: hidden;
  transition:
    transform 0.35s ease('spring'),
    visibility 0.35s;

  &--visible {
    transform: translate(-50%, 0);
    visibility: visible;
  }
}
</style>
