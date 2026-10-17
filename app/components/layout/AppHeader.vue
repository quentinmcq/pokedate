<script setup lang="ts">
const { caughtCount } = usePokedex()
const homePath = useRememberedPath('/')
const duelPath = useRememberedPath('/duel')
</script>

<template>
  <header class="site-header">
    <NuxtLink class="logo" to="/" aria-label="PokéDate, accueil">
      <PokeBall class="logo__ball" />
      <span>Poké<b>Date</b></span>
    </NuxtLink>
    <nav class="site-nav" aria-label="Navigation principale">
      <NuxtLink :to="homePath" exact-active-class="is-active">Mon Pokémon</NuxtLink>
      <NuxtLink :to="duelPath" active-class="is-active">Duel</NuxtLink>
      <NuxtLink to="/pokedex" active-class="is-active">
        Pokédex
        <span class="pill"
          ><span class="visually-hidden">, </span>{{ caughtCount }}<span class="visually-hidden"> attrapés</span></span
        >
      </NuxtLink>
    </nav>
  </header>
</template>

<style scoped lang="scss" src="./AppHeader.scss" />
