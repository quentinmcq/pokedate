<script setup lang="ts">
const { isReturning, endReturn } = usePokeBrawlReturn()
const { discoveries, caughtCount, loadDiscoveries } = usePokedex()
const pokebrawlHome = usePokeBrawlHome()
const { t } = useLocaleTools()
const pageName = useCurrentPageName()
const trackEvent = useTrackEvent()

onMounted(loadDiscoveries)

// The Pokédex travels in the hash, which browsers never send to a server; PokéBrawl stars the Pokémon caught here.
const href = computed(() => `${pokebrawlHome.value}#pokedex=${encodeDiscoveries(discoveries.value)}`)

function goBack() {
  trackEvent('pokebrawl')
  endReturn()
}
</script>

<template>
  <aside v-if="isReturning" class="pokebrawl-return" :aria-label="t('pokebrawl.returnLabel')">
    <Icon name="lucide:swords" class="pokebrawl-return__icon" aria-hidden="true" />
    <p v-if="caughtCount > 0" class="pokebrawl-return__text">
      {{ t('pokebrawl.returnReady', { count: caughtCount }, caughtCount) }}
    </p>
    <p v-else class="pokebrawl-return__text">{{ t('pokebrawl.returnEmpty') }}</p>
    <a v-if="caughtCount > 0" class="btn btn--primary btn--sm" :href="href" @click="goBack">
      {{ t('pokebrawl.returnAction') }}
    </a>
    <NuxtLinkLocale v-else-if="pageName !== 'index'" class="btn btn--primary btn--sm" to="/">
      {{ t('pokebrawl.catchAction') }}
    </NuxtLinkLocale>
    <button type="button" class="pokebrawl-return__close" :aria-label="t('common.close')" @click="endReturn">
      <Icon name="lucide:x" aria-hidden="true" />
    </button>
  </aside>
</template>

<style scoped lang="scss" src="./PokeBrawlReturnBar.scss" />
