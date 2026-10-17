<script setup lang="ts">
import type { DexEntry } from '#shared/types/pokemon'

const { resetAccent } = useAccent()
resetAccent()

const { data: list } = await useDexList()

const GEN_RANGES: [number, number][] = [
  [1, 151],
  [152, 251],
  [252, 386],
  [387, 493],
  [494, 649],
  [650, 721],
  [722, 809],
  [810, 905],
  [906, 1025],
]

const generations = computed(() =>
  GEN_RANGES.map(([from, to], i) => ({
    gen: i + 1,
    label: GENS[i + 1]!,
    pokemon: (list.value ?? []).filter((p: DexEntry) => p.id >= from && p.id <= to),
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

    <section v-for="g in generations" :key="g.gen" class="gen-block" :aria-labelledby="`gen-${g.gen}`">
      <h2 :id="`gen-${g.gen}`">
        Génération {{ g.label[0] }} <small>· {{ g.label[1] }} · {{ g.pokemon.length }} Pokémon</small>
      </h2>
      <ul class="dex-grid">
        <li v-for="p in g.pokemon" :key="p.id">
          <NuxtLink class="dex-cell" :to="pokemonPath(p)">
            <img loading="lazy" decoding="async" :src="miniUrl(p.id)" alt="" width="72" height="72" />
            <b>{{ p.fr }}</b>
            <span>#{{ padNumber(p.id, 4) }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
