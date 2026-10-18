<script setup lang="ts">
const { portfolioUrl, cloudflareAnalyticsToken } = useRuntimeConfig().public
const hasAudienceMeasurement = !!cloudflareAnalyticsToken
const { t } = useLocaleTools()

usePageSeo({
  title: () => t('legal.title'),
  description: () => t('legal.seoDescription'),
})
</script>

<template>
  <article class="legal">
    <h1>{{ t('legal.title') }}</h1>

    <section aria-labelledby="publisher">
      <h2 id="publisher">{{ t('legal.publisherTitle') }}</h2>
      <i18n-t keypath="legal.publisher" tag="p" scope="global">
        <template #contact><a :href="portfolioUrl" target="_blank" rel="noopener">quentin-macq.dev</a></template>
      </i18n-t>
    </section>

    <section aria-labelledby="host">
      <h2 id="host">{{ t('legal.hostTitle') }}</h2>
      <address>
        Cloudflare, Inc.<br />
        {{ t('legal.hostAddress') }}<br />
        +1 (650) 319-8930 · <a href="https://www.cloudflare.com" target="_blank" rel="noopener">cloudflare.com</a>
      </address>
    </section>

    <section aria-labelledby="intellectual-property">
      <h2 id="intellectual-property">{{ t('legal.ipTitle') }}</h2>
      <p>{{ t('legal.ipTrademarks') }}</p>
      <i18n-t keypath="legal.ipSources" tag="p" scope="global">
        <template #pokeapi><a href="https://pokeapi.co" target="_blank" rel="noopener">PokeAPI</a></template>
        <template #pokepedia><a href="https://www.pokepedia.fr" target="_blank" rel="noopener">Poképédia</a></template>
        <template #licence
          ><a :href="t('legal.licenceUrl')" target="_blank" rel="noopener">CC BY-NC-SA 3.0</a></template
        >
      </i18n-t>
      <p>{{ t('legal.ipRequests') }}</p>
    </section>

    <section aria-labelledby="personal-data">
      <h2 id="personal-data">{{ t('legal.dataTitle') }}</h2>
      <ul>
        <li>{{ t('legal.dataAccount') }}</li>
        <li>{{ t('legal.dataDraws') }}</li>
        <li>{{ t('legal.dataDates') }}</li>
        <li>{{ t('legal.dataPokedex') }}</li>
        <i18n-t v-if="hasAudienceMeasurement" keypath="legal.dataAnalytics" tag="li" scope="global">
          <template #analytics
            ><a href="https://www.cloudflare.com/web-analytics/" target="_blank" rel="noopener"
              >Cloudflare Web Analytics</a
            ></template
          >
        </i18n-t>
        <i18n-t v-if="hasAudienceMeasurement" keypath="legal.dataCounts" tag="li" scope="global">
          <template #optOut
            ><NuxtLinkLocale to="/?stats=off" class="text-link">{{ t('legal.optOutLink') }}</NuxtLinkLocale></template
          >
        </i18n-t>
        <li v-else>{{ t('legal.dataNoAnalytics') }}</li>
        <li>{{ t('legal.dataLogs') }}</li>
      </ul>
    </section>
  </article>
</template>

<style scoped lang="scss" src="./mentions-legales.scss" />
