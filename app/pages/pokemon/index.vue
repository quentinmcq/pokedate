<script setup lang="ts">
import type { TypeKey } from '#shared/types/pokemon'

const { resetAccent } = usePageAccent()
const { t } = useLocaleTools()
rememberCurrentPath('pokedex')
resetAccent()

const { data: entries } = await usePokedexEntries()

const searchQuery = ref('')
const selectedType = ref<TypeKey | null>(null)
const isFiltering = computed(() => searchQuery.value.trim() !== '' || selectedType.value !== null)

const matchingEntries = computed(() =>
  filterPokedexEntries(entries.value ?? [], { query: searchQuery.value, type: selectedType.value }),
)
const generationsWithPokemon = computed(() =>
  GENERATIONS.map((generation) => ({
    ...generation,
    pokemon: matchingEntries.value.filter((entry) => entry.id >= generation.firstId && entry.id <= generation.lastId),
  })).filter((generation) => generation.pokemon.length > 0),
)

// The 1025 tiles block a phone for a few hundred milliseconds when rendered at once: after a client-side navigation
// the generations appear one frame after another. Server rendering, hydration and back navigation (which restores
// the scroll position) still get the whole list at once.
const nuxtApp = useNuxtApp()
const isRestoringScrollPosition = () => (window.history.state?.scroll?.top ?? 0) > 0
const rendersProgressively = import.meta.client && !nuxtApp.isHydrating && !isRestoringScrollPosition()
const renderedGenerationCount = ref(rendersProgressively ? 1 : GENERATIONS.length)
const renderedGenerations = computed(() => generationsWithPokemon.value.slice(0, renderedGenerationCount.value))

function renderNextGeneration() {
  if (renderedGenerationCount.value >= GENERATIONS.length) return
  renderedGenerationCount.value++
  requestAnimationFrame(renderNextGeneration)
}

onMounted(() => requestAnimationFrame(renderNextGeneration))

function resetFilters() {
  searchQuery.value = ''
  selectedType.value = null
}

usePageSeo({
  title: () => t('pokemonList.seoTitle'),
  description: () => t('pokemonList.seoDescription'),
})
</script>

<template>
  <div>
    <div class="hero">
      <h1>{{ t('pokemonList.title') }}</h1>
      <i18n-t keypath="pokemonList.lead" tag="p" class="lead" scope="global">
        <template #test><NuxtLinkLocale to="/" class="text-link">{{ t('pokemonList.test') }}</NuxtLinkLocale></template>
      </i18n-t>

      <div class="dex-search" role="search">
        <label class="dex-search__field">
          <Icon name="lucide:search" aria-hidden="true" />
          <span class="visually-hidden">{{ t('pokemonList.search') }}</span>
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="t('pokemonList.searchPlaceholder')"
            autocomplete="off"
            spellcheck="false"
            enterkeyhint="search"
          />
        </label>
        <label class="dex-search__field dex-search__field--type">
          <span class="visually-hidden">{{ t('pokemonList.filterType') }}</span>
          <select v-model="selectedType">
            <option :value="null">{{ t('pokemonList.allTypes') }}</option>
            <option v-for="type in TYPE_KEYS" :key="type" :value="type">{{ t(`types.${type}`) }}</option>
          </select>
        </label>
      </div>
      <p class="dex-search__status" role="status">
        <template v-if="isFiltering">
          {{ t('pokemonList.found', { count: matchingEntries.length }, matchingEntries.length) }}
        </template>
      </p>
    </div>

    <div v-if="!matchingEntries.length" class="dex-search__empty">
      <p>{{ t('pokemonList.noMatch') }}</p>
      <button class="btn btn--ghost btn--sm" type="button" @click="resetFilters">{{ t('pokemonList.showAll') }}</button>
    </div>

    <section
      v-for="generation in renderedGenerations"
      :key="generation.roman"
      class="gen-block"
      :aria-labelledby="`generation-${generation.roman}`"
    >
      <h2 :id="`generation-${generation.roman}`">
        {{ t('pokemonList.generation', { roman: generation.roman }) }}
        <small>· {{ t(`regions.${generation.region}`) }} · {{ generation.pokemon.length }} Pokémon</small>
      </h2>
      <ul class="dex-grid">
        <li v-for="entry in generation.pokemon" :key="entry.id">
          <PokemonTile :pokemon="entry" />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped lang="scss" src="./index.scss" />
