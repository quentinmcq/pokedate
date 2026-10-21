<script setup lang="ts">
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const installPrompt = shallowRef<BeforeInstallPromptEvent | null>(null)
// Safari on iPhone and iPad never offers an install prompt: the help explains the Share menu instead.
const isAppleInstallHelpAvailable = ref(false)
const isAppleInstallHelpShown = ref(false)
const trackEvent = useTrackEvent()
const { t } = useLocaleTools()

function keepInstallPrompt(event: Event) {
  event.preventDefault()
  installPrompt.value = event as BeforeInstallPromptEvent
}

const forgetInstallPrompt = () => (installPrompt.value = null)

function isAppleMobileBrowser() {
  const isIpadAsDesktop = /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || isIpadAsDesktop
}

const isInstalledApp = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

async function installApp() {
  const prompt = installPrompt.value
  if (!prompt) return
  await prompt.prompt()
  if ((await prompt.userChoice).outcome !== 'accepted') return
  trackEvent('install')
  forgetInstallPrompt()
}

onMounted(() => {
  isAppleInstallHelpAvailable.value = isAppleMobileBrowser() && !isInstalledApp()
  window.addEventListener('beforeinstallprompt', keepInstallPrompt)
  window.addEventListener('appinstalled', forgetInstallPrompt)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', keepInstallPrompt)
  window.removeEventListener('appinstalled', forgetInstallPrompt)
})
</script>

<template>
  <Transition name="install-fade">
    <button v-if="installPrompt" class="btn btn--ghost btn--sm" type="button" @click="installApp">
      <Icon name="lucide:smartphone" aria-hidden="true" /> {{ t('footer.install') }}
    </button>
    <div v-else-if="isAppleInstallHelpAvailable" class="apple-install">
      <button
        class="btn btn--ghost btn--sm"
        type="button"
        :aria-expanded="isAppleInstallHelpShown"
        aria-controls="apple-install-help"
        @click="isAppleInstallHelpShown = !isAppleInstallHelpShown"
      >
        <Icon name="lucide:smartphone" aria-hidden="true" /> {{ t('footer.install') }}
      </button>
      <i18n-t
        v-show="isAppleInstallHelpShown"
        id="apple-install-help"
        keypath="footer.installApple"
        tag="p"
        class="apple-install__help"
        scope="global"
      >
        <template #share><Icon name="lucide:share" class="apple-install__share" aria-hidden="true" /></template>
      </i18n-t>
    </div>
  </Transition>
</template>

<style scoped lang="scss" src="./InstallAppButton.scss" />
