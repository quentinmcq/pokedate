<script setup lang="ts">
const { count } = useDex()
</script>

<template>
  <header class="site-header">
    <NuxtLink class="logo" to="/" aria-label="PokéDate, accueil">
      <span class="ball" aria-hidden="true" />
      <span>Poké<b>Date</b></span>
    </NuxtLink>
    <nav class="site-nav" aria-label="Navigation principale">
      <NuxtLink to="/" exact-active-class="is-active">Mon Pokémon</NuxtLink>
      <NuxtLink to="/duel" active-class="is-active">Duel</NuxtLink>
      <NuxtLink to="/pokedex" active-class="is-active">
        Pokédex
        <span class="pill"
          ><span class="visually-hidden">, </span>{{ count }}<span class="visually-hidden"> découverts</span></span
        >
      </NuxtLink>
    </nav>
  </header>
</template>
