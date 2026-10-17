<script setup lang="ts">
const { discoveries, discoveredCount, shinyCount } = usePokedex()
const { resetAccent } = usePageAccent()
resetAccent()

const { data: entries } = await usePokedexEntries()
const showOnlyDiscovered = ref(true)

const totalCount = computed(() => entries.value?.length ?? POKEMON_COUNT)
const visibleEntries = computed(() =>
  (entries.value ?? []).filter((entry) => !showOnlyDiscovered.value || discoveries.value[entry.id]),
)
const completionPercent = computed(() => (discoveredCount.value / totalCount.value) * 100)

usePageSeo({
  title: 'Mon Pokédex',
  description: 'Tous les Pokémon que tu as découverts avec PokéDate, en entrant tes dates et celles de tes amis.',
  noindex: true,
})
</script>

<template>
  <div>
    <div class="hero">
      <h1>Ton Pokédex</h1>
      <p class="lead">
        Chaque Pokémon révélé (le tien, ceux de tes potes, les duels…) est enregistré ici, dans ton navigateur.
        Saurez-vous les attraper tous&nbsp;?
      </p>
      <div
        class="progress"
        role="progressbar"
        aria-label="Progression du Pokédex"
        :aria-valuenow="discoveredCount"
        aria-valuemin="0"
        :aria-valuemax="totalCount"
        :aria-valuetext="`${discoveredCount} Pokémon découverts sur ${totalCount}`"
      >
        <div class="progress__fill" :style="{ width: `${completionPercent}%` }" />
      </div>
      <p class="dex-stats">
        {{ discoveredCount }} / {{ totalCount }} découverts ({{ formatNumber(completionPercent) }} %)<template
          v-if="shinyCount"
        >
          · {{ shinyCount }} shiny <Icon name="lucide:sparkles" aria-hidden="true"
        /></template>
      </p>
      <label class="toggle"
        ><input v-model="showOnlyDiscovered" type="checkbox" /> Afficher seulement les découverts</label
      >
    </div>

    <ul class="dex-grid">
      <li v-for="entry in visibleEntries" :key="entry.id">
        <PokemonTile :pokemon="entry" :discovered="!!discoveries[entry.id]" :shiny="discoveries[entry.id]?.shiny" />
      </li>
      <li v-if="!visibleEntries.length" class="empty-state">
        Ton Pokédex est vide.
        <NuxtLink to="/" class="text-link">Révèle ton premier Pokémon !</NuxtLink>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
@use '../assets/scss/abstracts/functions' as *;

.progress {
  height: 14px;
  max-width: 520px;
  margin: 0 auto;
  background: color('surface-1');
  border: 1px solid color('line');
  border-radius: 99px;
  overflow: hidden;

  &__fill {
    height: 100%;
    width: 0;
    background: linear-gradient(90deg, var(--color-brand), var(--color-highlight));
    transition: width 0.8s;
  }
}

.dex-stats {
  color: color('text-muted');
  font-family: var(--font-mono), monospace;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  color: color('text-muted');
  padding: 30px;
}
</style>
