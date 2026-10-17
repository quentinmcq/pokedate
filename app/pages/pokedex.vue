<script setup lang="ts">
const { dex, count, shinyCount } = useDex()
const { resetAccent } = useAccent()
resetAccent()

const { data: list } = await useDexList()
const onlyFound = ref(true)

const total = computed(() => list.value?.length ?? MAX_POKEMON)
const shown = computed(() => (list.value ?? []).filter((p) => !onlyFound.value || dex.value[p.id]))
const percent = computed(() => formatNumber((count.value / total.value) * 100))

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
        :aria-valuenow="count"
        aria-valuemin="0"
        :aria-valuemax="total"
        :aria-valuetext="`${count} Pokémon découverts sur ${total}`"
      >
        <div class="progress__fill" :style="{ width: `${(count / total) * 100}%` }" />
      </div>
      <p class="dex-stats">
        {{ count }} / {{ total }} découverts ({{ percent }} %)<template v-if="shinyCount">
          · {{ shinyCount }} shiny ✨</template
        >
      </p>
      <label class="toggle"><input v-model="onlyFound" type="checkbox" /> Afficher seulement les découverts</label>
    </div>

    <ul class="dex-grid">
      <li v-for="p in shown" :key="p.id">
        <NuxtLink
          v-if="dex[p.id]"
          class="dex-cell"
          :class="{ 'dex-cell--shiny': dex[p.id]!.s }"
          :to="{ path: pokemonPath(p), query: dex[p.id]!.s ? { shiny: '1' } : {} }"
        >
          <img loading="lazy" decoding="async" :src="miniUrl(p.id, !!dex[p.id]!.s)" alt="" width="72" height="72" />
          <b>{{ p.fr }}</b>
          <span>#{{ padNumber(p.id, 4) }}</span>
        </NuxtLink>
        <div v-else class="dex-cell dex-cell--unknown">
          <span class="dex-cell__unknown" aria-hidden="true">?</span>
          <span><span class="visually-hidden">Pas encore découvert : </span>#{{ padNumber(p.id, 4) }}</span>
        </div>
      </li>
      <li v-if="!shown.length" class="empty-state">
        Ton Pokédex est vide.
        <NuxtLink to="/" class="text-link">Révèle ton premier Pokémon !</NuxtLink>
      </li>
    </ul>
  </div>
</template>
