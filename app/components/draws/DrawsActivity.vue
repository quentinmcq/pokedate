<script setup lang="ts">
import type { DrawsActivity } from '#shared/types/pokemon'

const props = defineProps<{ activity: DrawsActivity }>()

const { t } = useLocaleTools()
const revealsLabel = computed(() =>
  t('activity.reveals', { count: props.activity.todayReveals }, props.activity.todayReveals),
)
</script>

<template>
  <section class="activity" aria-labelledby="activity-title">
    <h2 id="activity-title" class="activity__title">
      <Icon name="lucide:activity" aria-hidden="true" /> {{ t('activity.title') }}
    </h2>
    <p v-if="activity.todayReveals" class="activity__numbers">
      <b>{{ revealsLabel }}</b
      ><template v-if="activity.todayShiny">
        · <b>{{ activity.todayShiny }} shiny</b>
        <Icon name="lucide:sparkles" class="activity__sparkle" aria-hidden="true"
      /></template>
    </p>
    <i18n-t v-else keypath="activity.none" tag="p" class="activity__numbers" scope="global">
      <template #start><NuxtLinkLocale to="/" class="text-link">{{ t('activity.start') }}</NuxtLinkLocale></template>
    </i18n-t>
    <p v-if="activity.weekFavourite" class="activity__favourite">
      {{ t('activity.favourite') }}
      <span class="activity__pokemon">
        <img :src="spriteUrl(activity.weekFavourite.id)" alt="" width="48" height="48" loading="lazy" />
        <NuxtLinkLocale :to="pokemonPath(activity.weekFavourite)">{{ activity.weekFavourite.name }}</NuxtLinkLocale>
        <span class="activity__count">×{{ activity.weekFavourite.count }}</span>
      </span>
    </p>
  </section>
</template>

<style scoped lang="scss" src="./DrawsActivity.scss" />
