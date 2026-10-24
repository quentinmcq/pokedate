<script setup lang="ts">
const { discoveries, caughtCount } = usePokedex()
const { pokebrawlUrl } = useRuntimeConfig().public
const { t, locale } = useLocaleTools()
const trackEvent = useTrackEvent()

// The Pokédex travels in the hash, which browsers never send to a server; PokéBrawl stars the Pokémon caught here.
const href = computed(() => `${pokebrawlUrl}/#pokedex=${encodeDiscoveries(discoveries.value)}`)
</script>

<template>
  <!-- PokéBrawl only exists in French so far. -->
  <section v-if="locale === 'fr' && caughtCount > 0" class="pokebrawl" aria-labelledby="pokebrawl-title">
    <h2 id="pokebrawl-title" class="pokebrawl__title">{{ t('pokebrawl.pokedexTitle') }}</h2>
    <p>{{ t('pokebrawl.pokedexText', { count: caughtCount }) }}</p>
    <a class="btn btn--primary btn--sm" :href="href" target="_blank" rel="noopener" @click="trackEvent('pokebrawl')">
      <Icon name="lucide:swords" aria-hidden="true" /> {{ t('pokebrawl.pokedexAction') }}
    </a>
  </section>
</template>

<style scoped lang="scss" src="./PokedexToPokeBrawl.scss" />
