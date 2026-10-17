<script setup lang="ts">
const { dex, count, shinyCount } = useDex()
const { resetAccent } = useAccent()
resetAccent()

const { data: list } = await useDexList()
const onlyFound = ref(true)

const total = computed(() => list.value?.length ?? MAX_POKEMON)
const shown = computed(() => (list.value ?? []).filter((p) => !onlyFound.value || dex.value[p.id]))

useSeoMeta({
  title: 'Mon Pokédex · PokéDate',
  description: 'Tous les Pokémon que tu as découverts avec PokéDate.',
})
</script>

<template>
  <section>
    <div class="entry">
      <h1>Ton Pokédex</h1>
      <p class="sub">
        Chaque Pokémon révélé (le tien, ceux de tes potes, les duels…) est enregistré ici. Saurez-vous les attraper
        tous&nbsp;?
      </p>
      <div class="dex-progress"><div :style="{ width: `${(count / total) * 100}%` }" /></div>
      <p class="dex-text">
        {{ count }} / {{ total }} découverts ({{ formatNumber((count / total) * 100) }} %)<template v-if="shinyCount">
          · {{ shinyCount }} shiny ✨</template
        >
      </p>
      <label class="toggle"><input v-model="onlyFound" type="checkbox" /> Afficher seulement les découverts</label>
    </div>

    <div class="dex-grid">
      <template v-for="p in shown" :key="p.id">
        <NuxtLink
          v-if="dex[p.id]"
          class="dex-cell"
          :class="{ shiny: dex[p.id]!.s }"
          :to="{ path: `/pokemon/${p.id}`, query: dex[p.id]!.s ? { shiny: '1' } : {} }"
        >
          <img
            loading="lazy"
            :src="miniUrl(p.id, !!dex[p.id]!.s)"
            alt=""
            @error="($event.target as HTMLImageElement).src = artUrl(p.id)"
          />
          <b>{{ p.fr }}</b
          >#{{ padNumber(p.id, 4) }}
        </NuxtLink>
        <div v-else class="dex-cell unknown"><span class="q">?</span>#{{ padNumber(p.id, 4) }}</div>
      </template>
      <p v-if="!shown.length" class="dex-empty">
        Ton Pokédex est vide. <NuxtLink to="/">Révèle ton premier Pokémon !</NuxtLink>
      </p>
    </div>
  </section>
</template>
