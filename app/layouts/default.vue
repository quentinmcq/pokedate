<script setup lang="ts">
import type { SectionSwitchOption } from '~/components/ui/SectionSwitch.vue'

const CHALLENGE_OPTIONS: SectionSwitchOption[] = [
  { label: '1 contre 1', to: '/duel', icon: 'lucide:swords' },
  { label: 'Tournoi', to: '/tournoi', icon: 'lucide:trophy' },
]
const POKEDEX_OPTIONS: SectionSwitchOption[] = [
  { label: 'Mon Pokédex', to: '/pokedex', icon: 'lucide:book-open' },
  { label: 'Tous les Pokémon', to: '/pokemon', icon: 'lucide:layout-grid' },
]

const route = useRoute()
</script>

<template>
  <AppHeader />
  <main id="contenu" class="site-main" tabindex="-1">
    <SectionSwitch
      v-if="isSectionPath('challenges', route.path)"
      key="challenges"
      label="Type de défi"
      :options="CHALLENGE_OPTIONS"
    />
    <SectionSwitch
      v-else-if="isSectionPath('pokedex', route.path)"
      key="pokedex"
      label="Vue du Pokédex"
      :options="POKEDEX_OPTIONS"
    />
    <slot />
  </main>
  <AppFooter />
</template>

<style scoped lang="scss" src="./default.scss" />
