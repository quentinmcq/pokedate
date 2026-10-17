<script setup lang="ts">
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const installPrompt = shallowRef<BeforeInstallPromptEvent | null>(null)

function keepInstallPrompt(event: Event) {
  event.preventDefault()
  installPrompt.value = event as BeforeInstallPromptEvent
}

const forgetInstallPrompt = () => (installPrompt.value = null)

async function installApp() {
  const prompt = installPrompt.value
  if (!prompt) return
  await prompt.prompt()
  if ((await prompt.userChoice).outcome === 'accepted') forgetInstallPrompt()
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', keepInstallPrompt)
  window.addEventListener('appinstalled', forgetInstallPrompt)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', keepInstallPrompt)
  window.removeEventListener('appinstalled', forgetInstallPrompt)
})
</script>

<template>
  <button v-if="installPrompt" class="btn btn--ghost btn--sm" type="button" @click="installApp">
    <Icon name="lucide:smartphone" aria-hidden="true" /> Installer l'appli
  </button>
</template>
