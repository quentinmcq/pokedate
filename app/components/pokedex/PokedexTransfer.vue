<script setup lang="ts">
const { discoveries } = usePokedex()
const absoluteUrl = useAbsoluteUrl()
const { showToast } = useToast()
const trackEvent = useTrackEvent()

function openTransfer() {
  isOpen.value = true
  trackEvent('transfer')
}

const isOpen = ref(false)
const transferUrl = computed(
  () => `${absoluteUrl('/pokedex')}#${TRANSFER_HASH_KEY}=${encodeDiscoveries(discoveries.value)}`,
)
const canShare = ref(false)
onMounted(() => (canShare.value = typeof navigator.share === 'function'))

async function copyLink() {
  try {
    await navigator.clipboard.writeText(transferUrl.value)
    showToast('Lien copié : ouvre-le sur ton autre appareil')
  } catch {
    prompt('Copie ce lien :', transferUrl.value)
  }
}

const shareLink = () => navigator.share({ title: 'Mon Pokédex PokéDate', url: transferUrl.value }).catch(() => {})
</script>

<template>
  <section class="transfer" aria-labelledby="transfer-title">
    <h2 id="transfer-title" class="transfer__title">Ton Pokédex sur un autre appareil</h2>
    <template v-if="isOpen">
      <div class="transfer__panel">
        <QrCode :value="transferUrl" label="QR code du lien de transfert de ton Pokédex" :size="240" />
        <div class="transfer__help">
          <p>
            Scanne ce QR code avec ton autre appareil, ou envoie-toi le lien. Tes Pokémon s'ajouteront à ceux déjà
            présents là-bas.
          </p>
          <p class="transfer__note">Le lien contient seulement la liste de tes Pokémon, aucune date.</p>
          <div class="actions">
            <button class="btn btn--primary btn--sm" type="button" @click="copyLink">
              <Icon name="lucide:copy" aria-hidden="true" /> Copier le lien
            </button>
            <button v-if="canShare" class="btn btn--ghost btn--sm" type="button" @click="shareLink">
              <Icon name="lucide:share-2" aria-hidden="true" /> Partager
            </button>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <p>Ton Pokédex vit dans ce navigateur. Pour le retrouver sur ton téléphone ou ton ordinateur, transfère-le.</p>
      <button class="btn btn--ghost btn--sm" type="button" @click="openTransfer">
        <Icon name="lucide:qr-code" aria-hidden="true" /> Transférer mon Pokédex
      </button>
    </template>
  </section>
</template>

<style scoped lang="scss" src="./PokedexTransfer.scss" />
