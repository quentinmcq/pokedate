<script setup lang="ts">
const { discoveries } = usePokedex()
const absoluteUrl = useAbsoluteUrl()
const { showToast } = useToast()
const trackEvent = useTrackEvent()
const { t } = useLocaleTools()
const localePath = useLocalePath()

function openTransfer() {
  isOpen.value = true
  trackEvent('transfer')
}

const isOpen = ref(false)
const transferUrl = computed(
  () => `${absoluteUrl(localePath('/pokedex'))}#${TRANSFER_HASH_KEY}=${encodeDiscoveries(discoveries.value)}`,
)
const canShare = ref(false)
onMounted(() => (canShare.value = typeof navigator.share === 'function'))

async function copyLink() {
  try {
    await navigator.clipboard.writeText(transferUrl.value)
    showToast(t('transfer.copied'))
  } catch {
    prompt(t('common.copyPrompt'), transferUrl.value)
  }
}

const shareLink = () => navigator.share({ title: t('transfer.shareTitle'), url: transferUrl.value }).catch(() => {})
</script>

<template>
  <section class="transfer" aria-labelledby="transfer-title">
    <h2 id="transfer-title" class="transfer__title">{{ t('transfer.title') }}</h2>
    <template v-if="isOpen">
      <div class="transfer__panel">
        <QrCode :value="transferUrl" :label="t('transfer.qrLabel')" :size="240" />
        <div class="transfer__help">
          <p>{{ t('transfer.help') }}</p>
          <p class="transfer__note">{{ t('transfer.note') }}</p>
          <div class="actions">
            <button class="btn btn--primary btn--sm" type="button" @click="copyLink">
              <Icon name="lucide:copy" aria-hidden="true" /> {{ t('transfer.copy') }}
            </button>
            <button v-if="canShare" class="btn btn--ghost btn--sm" type="button" @click="shareLink">
              <Icon name="lucide:share-2" aria-hidden="true" /> {{ t('common.share') }}
            </button>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <p>{{ t('transfer.intro') }}</p>
      <button class="btn btn--ghost btn--sm" type="button" @click="openTransfer">
        <Icon name="lucide:qr-code" aria-hidden="true" /> {{ t('transfer.open') }}
      </button>
    </template>
  </section>
</template>

<style scoped lang="scss" src="./PokedexTransfer.scss" />
