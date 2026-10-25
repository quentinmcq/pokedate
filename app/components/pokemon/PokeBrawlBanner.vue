<script setup lang="ts">
const props = defineProps<{ pokemon: { id: number; name: string } }>()

const pokebrawlHome = usePokeBrawlHome()
const { t } = useLocaleTools()
const trackEvent = useTrackEvent()

// PokéBrawl enrols the Pokémon of the link in the visitor's team, ready for its daily challenge.
const href = computed(() => `${pokebrawlHome.value}?equipe=ids:${props.pokemon.id}`)
</script>

<template>
  <a class="pokebrawl-banner" :href="href" target="_blank" rel="noopener" @click="trackEvent('pokebrawl')">
    <img :src="spriteUrl(pokemon.id)" alt="" width="64" height="64" loading="lazy" />
    <div>
      <b><Icon name="lucide:swords" aria-hidden="true" /> {{ t('pokebrawl.bannerTitle', { name: pokemon.name }) }}</b>
      <span class="pokebrawl-banner__text">{{ t('pokebrawl.bannerText') }}</span>
    </div>
    <Icon name="lucide:external-link" class="pokebrawl-banner__external" aria-hidden="true" />
  </a>
</template>

<style scoped lang="scss" src="./PokeBrawlBanner.scss" />
