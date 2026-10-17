<script setup lang="ts">
const { resetAccent } = usePageAccent()
resetAccent()

const { data: entries } = await usePokedexEntries()

const generationsWithPokemon = computed(() =>
  GENERATIONS.map((generation) => ({
    ...generation,
    pokemon: (entries.value ?? []).filter((entry) => entry.id >= generation.firstId && entry.id <= generation.lastId),
  })),
)

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
