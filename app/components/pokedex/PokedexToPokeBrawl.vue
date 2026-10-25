<script setup lang="ts">
const { discoveries, caughtCount } = usePokedex()
const pokebrawlHome = usePokeBrawlHome()
const { t } = useLocaleTools()
const trackEvent = useTrackEvent()

// The Pokédex travels in the hash, which browsers never send to a server; PokéBrawl stars the Pokémon caught here.
const href = computed(() => `${pokebrawlHome.value}#pokedex=${encodeDiscoveries(discoveries.value)}`)
</script>

<template>
  <section v-if="caughtCount > 0" class="pokebrawl" aria-labelledby="pokebrawl-title">
    <h2 id="pokebrawl-title" class="pokebrawl__title">{{ t('pokebrawl.pokedexTitle') }}</h2>
    <p>{{ t('pokebrawl.pokedexText', { count: caughtCount }) }}</p>
    <a class="btn btn--primary btn--sm" :href="href" target="_blank" rel="noopener" @click="trackEvent('pokebrawl')">
      <Icon name="lucide:swords" aria-hidden="true" /> {{ t('pokebrawl.pokedexAction') }}
    </a>
  </section>
</template>

<style scoped lang="scss" src="./PokedexToPokeBrawl.scss" />
