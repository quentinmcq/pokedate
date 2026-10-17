<script setup lang="ts">
const route = useRoute()
const { caughtCount } = usePokedex()
const homePath = useRememberedPath('home')
const challengesPath = useRememberedPath('challenges')

const navItems = computed(() => [
  {
    label: 'Mon Pokémon',
    to: homePath.value,
    icon: 'lucide:calendar-heart',
    isActive: isSectionPath('home', route.path),
  },
  {
    label: 'Défis',
    to: challengesPath.value,
    icon: 'lucide:swords',
    isActive: isSectionPath('challenges', route.path),
  },
  {
    label: 'Pokédex',
    to: '/pokedex',
    icon: 'lucide:book-open',
    isActive: route.path === '/pokedex' || route.path.startsWith('/pokemon'),
    showsCaughtCount: true,
  },
  { label: 'Tirages', to: '/tirages', icon: 'lucide:radio-tower', isActive: route.path === '/tirages' },
])
</script>

<template>
  <header class="site-header">
    <NuxtLink class="logo" to="/" aria-label="PokéDate, accueil">
      <PokeBall class="logo__ball" />
      <span>Poké<b>Date</b></span>
    </NuxtLink>
    <nav class="site-nav" aria-label="Navigation principale">
      <NuxtLink
        v-for="item in navItems"
        :key="item.label"
        :to="item.to"
        class="site-nav__link"
        :class="{ 'is-active': item.isActive }"
        :aria-current="item.isActive ? 'page' : undefined"
      >
        <Icon :name="item.icon" class="site-nav__icon" aria-hidden="true" />
        <span class="site-nav__label">{{ item.label }}</span>
        <span v-if="item.showsCaughtCount" class="pill"
          ><span class="visually-hidden">, </span>{{ caughtCount }}<span class="visually-hidden"> attrapés</span></span
        >
      </NuxtLink>
    </nav>
  </header>
</template>

<style scoped lang="scss" src="./AppHeader.scss" />
