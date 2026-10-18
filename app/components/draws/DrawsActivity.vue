<script setup lang="ts">
import type { DrawsActivity } from '#shared/types/pokemon'

const props = defineProps<{ activity: DrawsActivity }>()

const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count > 1 ? pluralForm : singular}`

const revealsLabel = computed(() => plural(props.activity.todayReveals, 'Pokémon révélé', 'Pokémon révélés'))
</script>

<template>
  <section class="activity" aria-labelledby="activity-title">
    <h2 id="activity-title" class="activity__title">
      <Icon name="lucide:activity" aria-hidden="true" /> Aujourd'hui sur PokéDate
    </h2>
    <p v-if="activity.todayReveals" class="activity__numbers">
      <b>{{ revealsLabel }}</b
      ><template v-if="activity.todayShiny">
        · <b>{{ activity.todayShiny }} shiny</b>
        <Icon name="lucide:sparkles" class="activity__sparkle" aria-hidden="true"
      /></template>
    </p>
    <p v-else class="activity__numbers">
      Pas encore de Pokémon révélé aujourd'hui. <NuxtLink to="/" class="text-link">Lance-toi</NuxtLink>&nbsp;!
    </p>
    <p v-if="activity.weekFavourite" class="activity__favourite">
      Le plus tiré cette semaine&nbsp;:
      <span class="activity__pokemon">
        <img :src="spriteUrl(activity.weekFavourite.id)" alt="" width="40" height="40" loading="lazy" />
        <NuxtLink :to="pokemonPath(activity.weekFavourite)">{{ activity.weekFavourite.name }}</NuxtLink>
        <span class="activity__count">×{{ activity.weekFavourite.count }}</span>
      </span>
    </p>
  </section>
</template>

<style scoped lang="scss" src="./DrawsActivity.scss" />
