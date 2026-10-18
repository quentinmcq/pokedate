<script setup lang="ts">
import type { DrawsActivity, PublicDraw } from '#shared/types/pokemon'

const REFRESH_INTERVAL_MS = 30_000

const { resetAccent } = usePageAccent()
resetAccent()

const [{ data: draws, error, refresh: refreshDraws }, { data: activity, refresh: refreshActivity }] = await Promise.all(
  [
    useFetch<PublicDraw[]>('/api/draws', { key: 'public-draws' }),
    useFetch<DrawsActivity>('/api/activity', { key: 'draws-activity' }),
  ],
)

const refreshPage = () => Promise.all([refreshDraws(), refreshActivity()])

const timeFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})
const drawnAt = (draw: PublicDraw) => timeFormat.format(new Date(draw.createdAt)).replace(' ', ' à ')

let refreshTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  refreshTimer = setInterval(() => document.visibilityState === 'visible' && refreshPage(), REFRESH_INTERVAL_MS)
})
onBeforeUnmount(() => clearInterval(refreshTimer))

usePageSeo({
  title: 'Derniers tirages',
  description: "L'activité du jour sur PokéDate et les tirages partagés par les joueurs.",
  noindex: true,
})
</script>

<template>
  <div>
    <div class="hero">
      <h1>Derniers tirages</h1>
      <p class="lead">L'activité du jour et les derniers Pokémon révélés par les joueurs.</p>
    </div>

    <DrawsActivity v-if="activity" :activity="activity" />

    <h2 class="draws-title">Tirages partagés</h2>
    <p class="draws-hint">Du plus récent au plus ancien, 7 jours au plus.</p>

    <p v-if="error" class="draws-empty">Les derniers tirages sont indisponibles pour le moment.</p>
    <p v-else-if="!draws?.length" class="draws-empty">
      Aucun tirage pour l'instant. <NuxtLink to="/" class="text-link">Révèle ton Pokémon</NuxtLink>&nbsp;: il apparaîtra
      ici.
    </p>
    <ol v-else class="draws">
      <li v-for="draw in draws" :key="draw.id" class="draws__item">
        <img
          class="draws__sprite"
          :src="spriteUrl(draw.pokemonId, draw.shiny)"
          alt=""
          width="56"
          height="56"
          loading="lazy"
        />
        <p class="draws__text">
          <b>{{ draw.nickname }}</b> a tiré
          <NuxtLink :to="pokemonPath({ id: draw.pokemonId, name: draw.pokemonName })">{{ draw.pokemonName }}</NuxtLink>
          <span v-if="draw.shiny" class="draws__shiny"> <Icon name="lucide:sparkles" aria-hidden="true" /> shiny</span
          ><template v-if="draw.bonusPokemon"
            >, avec
            <NuxtLink :to="pokemonPath(draw.bonusPokemon)">{{ draw.bonusPokemon.name }}</NuxtLink>
            en bonus</template
          >
        </p>
        <time class="draws__time" :datetime="draw.createdAt">{{ drawnAt(draw) }}</time>
      </li>
    </ol>
  </div>
</template>

<style scoped lang="scss" src="./tirages.scss" />
