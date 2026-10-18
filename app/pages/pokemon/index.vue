<script setup lang="ts">
import type { TypeKey } from '#shared/types/pokemon'

const { resetAccent } = usePageAccent()
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

function resetFilters() {
  searchQuery.value = ''
  selectedType.value = null
}

usePageSeo({
  title: 'Les 1025 Pokémon : liste complète par génération',
  description:
    'La liste des 1025 Pokémon, de Bulbizarre à Pêchaminus, rangés par génération. Types, statistiques, faiblesses et évolutions de chaque Pokémon.',
})
</script>

<template>
  <div>
    <div class="hero">
      <h1>Les 1025 Pokémon</h1>
      <p class="lead">
        Tout le Pokédex national, génération par génération. Envie de savoir lequel se cache dans ta date ?
        <NuxtLink to="/" class="text-link">Fais le test</NuxtLink>.
      </p>

      <div class="dex-search" role="search">
        <label class="dex-search__field">
          <Icon name="lucide:search" aria-hidden="true" />
          <span class="visually-hidden">Rechercher un Pokémon</span>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Nom ou numéro"
            autocomplete="off"
            spellcheck="false"
            enterkeyhint="search"
          />
        </label>
        <label class="dex-search__field dex-search__field--type">
          <span class="visually-hidden">Filtrer par type</span>
          <select v-model="selectedType">
            <option :value="null">Tous les types</option>
            <option v-for="type in TYPE_KEYS" :key="type" :value="type">{{ POKEMON_TYPES[type].label }}</option>
          </select>
        </label>
      </div>
      <p class="dex-search__status" role="status">
        <template v-if="isFiltering">
          {{ matchingEntries.length }} Pokémon trouvé{{ matchingEntries.length > 1 ? 's' : '' }}
        </template>
      </p>
    </div>

    <div v-if="!matchingEntries.length" class="dex-search__empty">
      <p>Aucun Pokémon ne correspond à ta recherche.</p>
      <button class="btn btn--ghost btn--sm" type="button" @click="resetFilters">Tout afficher</button>
    </div>

    <section
      v-for="generation in generationsWithPokemon"
      :key="generation.roman"
      class="gen-block"
      :aria-labelledby="`generation-${generation.roman}`"
    >
      <h2 :id="`generation-${generation.roman}`">
        Génération {{ generation.roman }}
        <small>· {{ generation.region }} · {{ generation.pokemon.length }} Pokémon</small>
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
