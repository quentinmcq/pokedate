<script setup lang="ts">
const { discoveredCount } = usePokedex()
</script>

<template>
  <header class="site-header">
    <NuxtLink class="logo" to="/" aria-label="PokéDate, accueil">
      <PokeBall class="logo__ball" />
      <span>Poké<b>Date</b></span>
    </NuxtLink>
    <nav class="site-nav" aria-label="Navigation principale">
      <NuxtLink to="/" exact-active-class="is-active">Mon Pokémon</NuxtLink>
      <NuxtLink to="/duel" active-class="is-active">Duel</NuxtLink>
      <NuxtLink to="/pokedex" active-class="is-active">
        Pokédex
        <span class="pill"
          ><span class="visually-hidden">, </span>{{ discoveredCount
          }}<span class="visually-hidden"> découverts</span></span
        >
      </NuxtLink>
    </nav>
  </header>
</template>

<style scoped lang="scss">
@use '../assets/scss/abstracts/tokens' as *;
@use '../assets/scss/abstracts/functions' as *;
@use '../assets/scss/abstracts/mixins' as *;

.site-header {
  position: relative;
  z-index: z('header');
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: space(4);
  flex-wrap: wrap;
  width: 100%;
  max-width: $container-width;
  margin: 0 auto;
  padding: space(5) space(4) space(2);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  font-weight: weight('black');
  font-size: font-size('xl');
  letter-spacing: -0.02em;

  b {
    color: color('highlight');
  }

  &:hover .logo__ball {
    animation: wobble 0.6s;
  }
}

.site-nav {
  display: flex;
  gap: space(1);
  background: rgba(0, 0, 0, 0.25);
  padding: space(1);
  border-radius: radius('pill');
  border: 1px solid color('line');

  a {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: space(2) 14px;
    border-radius: radius('pill');
    font-weight: weight('semibold');
    color: color('text-muted');
    text-decoration: none;
    white-space: nowrap;
    transition:
      color duration('base'),
      background duration('base');

    &:hover {
      color: color('text');
    }

    &.is-active {
      background: color('text');
      color: color('on-light');
    }
  }

  @include bp(phone) {
    a {
      padding: 7px 10px;
      font-size: font-size('sm');
    }
  }
}

.pill {
  font-family: var(--font-mono), monospace;
  font-size: font-size('2xs');
  background: color('highlight');
  color: color('on-light');
  padding: 1px 7px;
  border-radius: radius('pill');
}
</style>
