<script setup lang="ts">
const { portfolioUrl } = useRuntimeConfig().public
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <nav class="site-footer__nav" aria-label="Liens du site">
        <NuxtLink to="/">Mon Pokémon</NuxtLink>
        <NuxtLink to="/duel">Duel</NuxtLink>
        <NuxtLink to="/tournoi">Tournoi</NuxtLink>
        <NuxtLink to="/pokedex">Mon Pokédex</NuxtLink>
        <NuxtLink to="/pokemon">Les 1025 Pokémon</NuxtLink>
        <NuxtLink to="/mentions-legales">Mentions légales</NuxtLink>
      </nav>
      <InstallAppButton />
      <p class="site-footer__author">
        Fait avec <Icon name="lucide:heart" class="site-footer__heart" aria-label="amour" /> par
        <a :href="portfolioUrl" target="_blank" rel="noopener">Quentin Macq</a>
      </p>
      <p class="site-footer__legal">
        Données : <a href="https://pokeapi.co" target="_blank" rel="noopener">PokeAPI</a> et
        <a href="https://www.pokepedia.fr" target="_blank" rel="noopener">Poképédia</a>. Pokémon © Nintendo / Game Freak
        / The Pokémon Company. Projet de fan, non officiel et sans but commercial. Ton Pokédex reste dans ton navigateur
        : aucun compte, aucun cookie, aucun traceur.
      </p>
    </div>
  </footer>
</template>

<style scoped lang="scss" src="./AppFooter.scss" />
