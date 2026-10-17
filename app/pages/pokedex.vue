<script setup lang="ts">
import type { Discoveries } from '~/composables/usePokedex'

const { discoveries, seenCount, caughtCount, shinyCount, isLoaded, discoveryStateOf } = usePokedex()
const { resetAccent } = usePageAccent()
resetAccent()

const { data: entries } = await usePokedexEntries()
const showOnlyDiscovered = ref(true)

const totalCount = computed(() => entries.value?.length ?? POKEMON_COUNT)
const visibleEntries = computed(() =>
  (entries.value ?? []).filter((entry) => !showOnlyDiscovered.value || discoveries.value[entry.id]),
)
const route = useRoute()
const router = useRouter()
const incomingDiscoveries = ref<Discoveries | null>(null)
const TRANSFER_HASH_PATTERN = new RegExp(`^#${TRANSFER_HASH_KEY}=(.+)$`)

function readTransferFromHash(hash: string) {
  const code = TRANSFER_HASH_PATTERN.exec(hash)?.[1]
  const decoded = code ? decodeDiscoveries(code) : null
  incomingDiscoveries.value = decoded && Object.keys(decoded).length ? decoded : null
}

function finishImport() {
  incomingDiscoveries.value = null
  router.replace({ hash: '' })
}

onMounted(() => watch(() => route.hash, readTransferFromHash, { immediate: true }))

const isEmpty = computed(() => isLoaded.value && seenCount.value === 0)
const completionPercent = computed(() => (caughtCount.value / totalCount.value) * 100)

usePageSeo({
  title: 'Mon Pokédex',
  description: 'Tous les Pokémon que tu as découverts avec PokéDate, en entrant tes dates et celles de tes amis.',
  noindex: true,
})
</script>

<template>
  <div>
    <div class="hero">
      <h1>Ton Pokédex</h1>
      <p class="lead">
        Chaque date que tu entres (la tienne, celles de tes potes, les duels…) attrape son Pokémon. Ceux que tu croises
        au hasard ou sur leur fiche sont seulement vus. Attrape-les tous&nbsp;!
      </p>
      <PokedexImport v-if="incomingDiscoveries" :incoming="incomingDiscoveries" @done="finishImport" />
      <template v-if="!isEmpty">
        <div
          class="progress"
          role="progressbar"
          aria-label="Progression du Pokédex"
          :aria-valuenow="caughtCount"
          aria-valuemin="0"
          :aria-valuemax="totalCount"
          :aria-valuetext="`${caughtCount} Pokémon attrapés sur ${totalCount}`"
        >
          <div class="progress__fill" :style="{ width: `${completionPercent}%` }" />
        </div>
        <p class="dex-stats">
          {{ caughtCount }} / {{ totalCount }} attrapés ({{ formatNumber(completionPercent) }} %) · {{ seenCount }} vu{{
            seenCount > 1 ? 's' : ''
          }}<template v-if="shinyCount">
            · {{ shinyCount }} shiny <Icon name="lucide:sparkles" aria-hidden="true"
          /></template>
        </p>
        <label class="toggle"
          ><input v-model="showOnlyDiscovered" type="checkbox" /> Afficher seulement les découverts</label
        >
      </template>
    </div>

    <div v-if="isEmpty" class="empty-state">
      <PokeBall :size="56" />
      <p>Ton Pokédex est vide. Révèle le Pokémon de ta date pour commencer ta collection.</p>
      <NuxtLink to="/" class="btn btn--primary"
        ><Icon name="lucide:sparkles" aria-hidden="true" /> Révéler mon premier Pokémon</NuxtLink
      >
    </div>

    <ul v-else class="dex-grid">
      <li v-for="entry in visibleEntries" :key="entry.id">
        <PokemonTile :pokemon="entry" :state="discoveryStateOf(entry.id)" :shiny="discoveries[entry.id]?.shiny" />
      </li>
    </ul>

    <PokedexTransfer v-if="isLoaded && !isEmpty" />
  </div>
</template>

<style scoped lang="scss" src="./pokedex.scss" />
