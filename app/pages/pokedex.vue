<script setup lang="ts">
import type { Discoveries } from '~/composables/usePokedex'

const { discoveries, seenCount, caughtCount, shinyCount, isLoaded, discoveryStateOf } = usePokedex()
const { resetAccent } = usePageAccent()
const { t, formatLocalNumber } = useLocaleTools()
rememberCurrentPath('pokedex')
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
  title: () => t('pokedex.seoTitle'),
  description: () => t('pokedex.seoDescription'),
  noindex: true,
})
</script>

<template>
  <div>
    <div class="hero">
      <h1>{{ t('pokedex.title') }}</h1>
      <p class="lead">{{ t('pokedex.lead') }}</p>
      <PokedexImport v-if="incomingDiscoveries" :incoming="incomingDiscoveries" @done="finishImport" />
      <template v-if="!isEmpty">
        <div
          class="progress"
          role="progressbar"
          :aria-label="t('pokedex.progress')"
          :aria-valuenow="caughtCount"
          aria-valuemin="0"
          :aria-valuemax="totalCount"
          :aria-valuetext="t('pokedex.progressText', { caught: caughtCount, total: totalCount })"
        >
          <div class="progress__fill" :style="{ width: `${completionPercent}%` }" />
        </div>
        <p class="dex-stats">
          {{
            t('pokedex.stats', {
              caught: caughtCount,
              total: totalCount,
              percent: formatLocalNumber(completionPercent),
            })
          }}
          · {{ t('pokedex.seen', { count: seenCount }, seenCount)
          }}<template v-if="shinyCount">
            · {{ shinyCount }} shiny <Icon name="lucide:sparkles" aria-hidden="true"
          /></template>
        </p>
        <label class="toggle"
          ><input v-model="showOnlyDiscovered" type="checkbox" /> {{ t('pokedex.hideUnseen') }}</label
        >
      </template>
    </div>

    <PokedexGoals v-if="isLoaded && !isEmpty" :entries="entries" />

    <div v-if="isEmpty" class="empty-state">
      <PokeBall :size="56" />
      <p>{{ t('pokedex.empty') }}</p>
      <NuxtLinkLocale to="/" class="btn btn--primary"
        ><Icon name="lucide:sparkles" aria-hidden="true" /> {{ t('pokedex.revealFirst') }}</NuxtLinkLocale
      >
    </div>

    <ul v-else class="dex-grid">
      <li v-for="entry in visibleEntries" :key="entry.id">
        <PokemonTile
          :pokemon="entry"
          :state="discoveryStateOf(entry.id)"
          :shiny="discoveries[entry.id]?.shiny"
          :seen-shiny="discoveries[entry.id]?.seenShiny"
        />
      </li>
    </ul>

    <PokedexTransfer v-if="isLoaded && !isEmpty" />
  </div>
</template>

<style scoped lang="scss" src="./pokedex.scss" />
