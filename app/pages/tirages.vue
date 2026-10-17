<script setup lang="ts">
import type { PublicDraw } from '#shared/types/pokemon'

const REFRESH_INTERVAL_MS = 30_000

const { resetAccent } = usePageAccent()
resetAccent()

const { data: draws, error, refresh } = await useFetch<PublicDraw[]>('/api/draws', { key: 'public-draws' })

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
  refreshTimer = setInterval(() => document.visibilityState === 'visible' && refresh(), REFRESH_INTERVAL_MS)
})
onBeforeUnmount(() => clearInterval(refreshTimer))

usePageSeo({
  title: 'Derniers tirages',
  description: 'Les derniers Pokémon révélés et publiés par les joueurs de PokéDate.',
  noindex: true,
})
</script>

<template>
  <div>
    <div class="hero">
      <h1>Derniers tirages</h1>
      <p class="lead">
        Les Pokémon que les joueurs ont choisi de publier, du plus récent au plus ancien. Ils restent ici 7 jours au
        plus.
      </p>
    </div>

    <p v-if="error" class="draws-empty">Les derniers tirages sont indisponibles pour le moment.</p>
    <p v-else-if="!draws?.length" class="draws-empty">
      Aucun tirage publié pour l'instant. <NuxtLink to="/" class="text-link">Révèle ton Pokémon</NuxtLink> et sois le
      premier à le publier&nbsp;!
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
          <span v-if="draw.shiny" class="draws__shiny"> <Icon name="lucide:sparkles" aria-hidden="true" /> shiny</span>
        </p>
        <time class="draws__time" :datetime="draw.createdAt">{{ drawnAt(draw) }}</time>
      </li>
    </ol>
  </div>
</template>

<style scoped lang="scss" src="./tirages.scss" />
