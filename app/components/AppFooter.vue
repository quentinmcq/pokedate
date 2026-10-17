<script setup lang="ts">
const { portfolioUrl } = useRuntimeConfig().public
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <nav class="site-footer__nav" aria-label="Liens du site">
        <NuxtLink to="/">Mon Pokémon</NuxtLink>
        <NuxtLink to="/duel">Duel</NuxtLink>
        <NuxtLink to="/pokedex">Mon Pokédex</NuxtLink>
        <NuxtLink to="/pokemon">Les 1025 Pokémon</NuxtLink>
        <NuxtLink to="/mentions-legales">Mentions légales</NuxtLink>
      </nav>
      <p class="site-footer__author">
        Fait avec <Icon name="lucide:heart" class="site-footer__heart" aria-label="amour" /> par
        <a :href="portfolioUrl" target="_blank" rel="noopener">Quentin Macq</a>
      </p>
      <p class="site-footer__legal">
        Données : <a href="https://pokeapi.co" target="_blank" rel="noopener">PokeAPI</a>. Pokémon © Nintendo / Game
        Freak / The Pokémon Company. Projet de fan, non officiel et sans but commercial. Ton Pokédex reste dans ton
        navigateur : aucun compte, aucun cookie, aucun traceur.
      </p>
    </div>
  </footer>
</template>

<style scoped lang="scss">
@use '../assets/scss/abstracts/tokens' as *;
@use '../assets/scss/abstracts/functions' as *;

.site-footer {
  position: relative;
  z-index: z('base');
  border-top: 1px solid color('line');
  background: rgba(0, 0, 0, 0.18);
  color: color('text-subtle');
  font-size: font-size('xs');

  &__inner {
    max-width: $container-width;
    margin: 0 auto;
    padding: space(6) space(4) space(8);
    display: flex;
    gap: space(4) space(8);
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
  }

  &__nav {
    display: flex;
    gap: space(2) space(5);
    flex-wrap: wrap;

    a {
      color: color('text-muted');
      text-decoration: none;
      font-weight: weight('semibold');

      &:hover {
        color: color('text');
        text-decoration: underline;
      }
    }
  }

  &__author {
    font-size: font-size('sm');
    color: color('text-muted');

    a {
      color: color('highlight');
      font-weight: weight('bold');
      text-underline-offset: 3px;
    }
  }

  &__heart {
    color: color('brand');
  }

  &__legal {
    flex-basis: 100%;
    margin: 0;
    line-height: 1.5;

    a {
      color: color('text-muted');
    }
  }
}
</style>
