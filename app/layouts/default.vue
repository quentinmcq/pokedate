<script setup lang="ts">
import type { SectionSwitchOption } from '~/components/ui/SectionSwitch.vue'

const { t } = useLocaleTools()
const localePath = useLocalePath()
const pageName = useCurrentPageName()

const challengeOptions = computed<SectionSwitchOption[]>(() => [
  { label: t('sections.duel'), to: localePath('/duel'), icon: 'lucide:swords' },
  { label: t('sections.tournament'), to: localePath('/tournoi'), icon: 'lucide:trophy' },
])
const pokedexOptions = computed<SectionSwitchOption[]>(() => [
  { label: t('sections.myPokedex'), to: localePath('/pokedex'), icon: 'lucide:book-open' },
  { label: t('sections.allPokemon'), to: localePath('/pokemon'), icon: 'lucide:layout-grid' },
])
</script>

<template>
  <AppHeader />
  <main id="contenu" class="site-main" tabindex="-1">
    <SectionSwitch
      v-if="isSectionPage('challenges', pageName)"
      key="challenges"
      :label="t('sections.challengesLabel')"
      :options="challengeOptions"
    />
    <SectionSwitch
      v-else-if="isSectionPage('pokedex', pageName)"
      key="pokedex"
      :label="t('sections.pokedexLabel')"
      :options="pokedexOptions"
    />
    <slot />
  </main>
  <AppFooter />
  <PokeBrawlReturnBar />
</template>

<style scoped lang="scss" src="./default.scss" />
