<script setup lang="ts">
const { t } = useLocaleTools()
</script>

<template>
  <section class="section" aria-labelledby="how-it-works">
    <h2 id="how-it-works" class="section__title">{{ t('home.howTitle') }}</h2>
    <ol class="steps">
      <li>
        <strong>{{ t('home.stepDateTitle') }}</strong
        >{{ t('home.stepDateText') }}
      </li>
      <li>
        <strong>{{ t('home.stepDigitsTitle') }}</strong
        >{{ t('home.stepDigitsText') }}
      </li>
      <li>
        <strong>{{ t('home.stepChallengeTitle') }}</strong
        ><i18n-t keypath="home.stepChallengeText" tag="span" scope="global">
          <template #duel
            ><NuxtLinkLocale to="/duel" class="text-link">{{ t('home.stepChallengeDuel') }}</NuxtLinkLocale></template
          >
          <template #pokedex><NuxtLinkLocale to="/pokedex" class="text-link">Pokédex</NuxtLinkLocale></template>
        </i18n-t>
      </li>
    </ol>
  </section>

  <section class="section" aria-labelledby="faq">
    <h2 id="faq" class="section__title">{{ t('home.faqTitle') }}</h2>
    <div class="faq">
      <AccordionItem v-for="key in HOME_FAQ_KEYS" :key="key" :question="t(`faq.${key}.question`)" group="faq">
        <p>{{ t(`faq.${key}.answer`) }}</p>
      </AccordionItem>
    </div>
  </section>
</template>

<style scoped lang="scss" src="./HomeGuide.scss" />
