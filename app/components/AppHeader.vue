<script setup lang="ts">
const { count } = useDex()
</script>

<template>
  <header class="top">
    <NuxtLink class="logo" to="/" aria-label="PokéDate, accueil">
      <span class="ball" aria-hidden="true" />
      <span>Poké<b>Date</b></span>
    </NuxtLink>
    <nav class="tabs" aria-label="Navigation">
      <NuxtLink to="/" exact-active-class="active">Mon Pokémon</NuxtLink>
      <NuxtLink to="/duel" active-class="active">Duel</NuxtLink>
      <NuxtLink to="/pokedex" active-class="active"
        >Pokédex <span class="pill">{{ count }}</span></NuxtLink
      >
    </nav>
  </header>
</template>
