<script setup lang="ts">
import type { Discoveries } from '~/composables/usePokedex'

const props = defineProps<{ incoming: Discoveries }>()
const emit = defineEmits<{ done: [] }>()

const { importDiscoveries } = usePokedex()
const { showToast } = useToast()
const trackEvent = useTrackEvent()

const incomingCaughtCount = computed(() => Object.values(props.incoming).filter((discovery) => discovery.caught).length)
const incomingSeenCount = computed(() => Object.keys(props.incoming).length - incomingCaughtCount.value)

function acceptImport() {
  const newlyCaught = importDiscoveries(props.incoming)
  trackEvent('import')
  showToast(
    newlyCaught
      ? `${newlyCaught} Pokémon attrapé${newlyCaught > 1 ? 's' : ''} en plus !`
      : 'Ton Pokédex était déjà à jour',
  )
  emit('done')
}
</script>

<template>
  <section class="import" aria-labelledby="import-title">
    <Icon name="lucide:download" class="import__icon" aria-hidden="true" />
    <div>
      <h2 id="import-title" class="import__title">Un Pokédex t'attend</h2>
      <p>
        {{ incomingCaughtCount }} Pokémon attrapé{{ incomingCaughtCount > 1 ? 's' : ''
        }}<template v-if="incomingSeenCount">
          et {{ incomingSeenCount }} vu{{ incomingSeenCount > 1 ? 's' : '' }}</template
        >. Ils s'ajouteront à ton Pokédex actuel, sans rien effacer.
      </p>
      <div class="actions">
        <button class="btn btn--primary btn--sm" type="button" @click="acceptImport">Ajouter à mon Pokédex</button>
        <button class="btn btn--ghost btn--sm" type="button" @click="emit('done')">Ignorer</button>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss" src="./PokedexImport.scss" />
