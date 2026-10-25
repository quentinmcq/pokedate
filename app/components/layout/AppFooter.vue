<script setup lang="ts">
const { portfolioUrl } = useRuntimeConfig().public
const pokebrawlHome = usePokeBrawlHome()
const { t } = useLocaleTools()
const trackEvent = useTrackEvent()
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <nav class="site-footer__nav" :aria-label="t('footer.navLabel')">
        <NuxtLinkLocale to="/duel">{{ t('footer.duel') }}</NuxtLinkLocale>
        <NuxtLinkLocale to="/tournoi">{{ t('footer.tournament') }}</NuxtLinkLocale>
        <NuxtLinkLocale to="/pokemon">{{ t('footer.allPokemon') }}</NuxtLinkLocale>
        <NuxtLinkLocale to="/tirages">{{ t('footer.draws') }}</NuxtLinkLocale>
        <NuxtLinkLocale to="/mentions-legales">{{ t('footer.legal') }}</NuxtLinkLocale>
        <!-- PokéBrawl only exists in French so far. -->
        <a :href="pokebrawlHome" target="_blank" rel="noopener" @click="trackEvent('pokebrawl')">
          {{ t('footer.pokebrawl') }} <Icon name="lucide:external-link" aria-hidden="true" />
        </a>
      </nav>
      <i18n-t keypath="footer.author" tag="p" class="site-footer__author" scope="global">
        <template #heart
          ><Icon name="lucide:heart" class="site-footer__heart" :aria-label="t('footer.love')"
        /></template>
        <template #name><a :href="portfolioUrl" target="_blank" rel="noopener">Quentin Macq</a></template>
      </i18n-t>
      <i18n-t keypath="footer.credits" tag="p" class="site-footer__legal" scope="global">
        <template #pokeapi><a href="https://pokeapi.co" target="_blank" rel="noopener">PokeAPI</a></template>
        <template #pokepedia><a href="https://www.pokepedia.fr" target="_blank" rel="noopener">Poképédia</a></template>
      </i18n-t>
      <div class="site-footer__install">
        <InstallAppButton />
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss" src="./AppFooter.scss" />
