<script setup lang="ts">
import type { DrawsActivity, PublicDraw } from '#shared/types/pokemon'

const REFRESH_INTERVAL_MS = 30_000

const { resetAccent } = usePageAccent()
const { t, locale } = useLocaleTools()
resetAccent()

const PLACEHOLDER_ROWS = 6

// Lazy: a tap on the tab shows the page at once and the feed fills in, instead of waiting for both answers first.
// The server still renders the page with its data.
const [
  { data: draws, error, status: drawsStatus, refresh: refreshDraws },
  { data: activity, status: activityStatus, refresh: refreshActivity },
] = await Promise.all([
  useFetch<PublicDraw[]>('/api/draws', {
    key: () => `public-draws-${locale.value}`,
    query: { lang: locale },
    lazy: true,
  }),
  useFetch<DrawsActivity>('/api/activity', {
    key: () => `draws-activity-${locale.value}`,
    query: { lang: locale },
    lazy: true,
  }),
])
const isLoadingDraws = computed(() => !draws.value && drawsStatus.value === 'pending')
const isLoadingActivity = computed(() => !activity.value && activityStatus.value === 'pending')

const refreshPage = () => Promise.all([refreshDraws(), refreshActivity()])

const dayFormat = computed(
  () =>
    new Intl.DateTimeFormat(LOCALE_TAGS[locale.value], { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit' }),
)
const hourFormat = computed(
  () =>
    new Intl.DateTimeFormat(LOCALE_TAGS[locale.value], {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
    }),
)
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const parisDay = (date: Date) => toIsoDate(todayInTimeZone('Europe/Paris', date))

function drawnAt(draw: PublicDraw) {
  const createdAt = new Date(draw.createdAt)
  const time = hourFormat.value.format(createdAt)
  const day = parisDay(createdAt)
  if (day === parisDay(new Date())) return t('draws.drawnToday', { time })
  if (day === parisDay(new Date(Date.now() - ONE_DAY_MS))) return t('draws.drawnYesterday', { time })
  return t('draws.drawnAt', { day: dayFormat.value.format(createdAt), time })
}
const drawLink = (draw: PublicDraw) => ({
  path: pokemonPath({ id: draw.pokemonId, name: draw.pokemonName }),
  query: draw.shiny ? { shiny: '1' } : {},
})
// A draw without a nickname reads as "Someone got…" rather than showing a placeholder name.
function drawSentenceKey(draw: PublicDraw) {
  const isAnonymous = draw.nickname === ANONYMOUS_NICKNAME
  if (draw.bonusPokemon) return isAnonymous ? 'draws.someoneDrewWithBonus' : 'draws.drewWithBonus'
  return isAnonymous ? 'draws.someoneDrew' : 'draws.drew'
}

let refreshTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  refreshTimer = setInterval(() => document.visibilityState === 'visible' && refreshPage(), REFRESH_INTERVAL_MS)
})
onBeforeUnmount(() => clearInterval(refreshTimer))

usePageSeo({
  title: () => t('draws.title'),
  description: () => t('draws.seoDescription'),
  noindex: true,
})
</script>

<template>
  <div>
    <div class="hero">
      <h1>{{ t('draws.title') }}</h1>
    </div>

    <DrawsActivity v-if="activity" :activity="activity" />
    <div v-else-if="isLoadingActivity" class="activity-placeholder placeholder" aria-hidden="true" />

    <h2 class="draws-title">{{ t('draws.listTitle') }}</h2>
    <p class="draws-hint">{{ t('draws.listHint') }}</p>

    <p v-if="isLoadingDraws" class="visually-hidden" role="status">{{ t('draws.loading') }}</p>
    <ol v-if="isLoadingDraws" class="draws" aria-hidden="true">
      <li v-for="row in PLACEHOLDER_ROWS" :key="row" class="draws__item draws__item--placeholder">
        <span class="draws__sprite placeholder" />
        <span class="draws__line placeholder" />
      </li>
    </ol>
    <p v-else-if="error" class="draws-empty">{{ t('draws.unavailable') }}</p>
    <i18n-t v-else-if="!draws?.length" keypath="draws.empty" tag="p" class="draws-empty" scope="global">
      <template #reveal
        ><NuxtLinkLocale to="/" class="text-link">{{ t('draws.revealYours') }}</NuxtLinkLocale></template
      >
    </i18n-t>
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
        <i18n-t :keypath="drawSentenceKey(draw)" tag="p" class="draws__text" scope="global">
          <template #nickname
            ><b>{{ draw.nickname }}</b></template
          >
          <template #pokemon
            ><span class="draws__pokemon"
              ><NuxtLinkLocale :to="drawLink(draw)">{{ draw.pokemonName }}</NuxtLinkLocale
              ><span v-if="draw.shiny" class="draws__shiny">
                <Icon name="lucide:sparkles" aria-hidden="true" /> shiny</span
              ></span
            ></template
          >
          <template v-if="draw.bonusPokemon" #bonus
            ><NuxtLinkLocale :to="pokemonPath(draw.bonusPokemon)">{{
              draw.bonusPokemon.name
            }}</NuxtLinkLocale></template
          >
        </i18n-t>
        <time class="draws__time" :datetime="draw.createdAt">{{ drawnAt(draw) }}</time>
      </li>
    </ol>
  </div>
</template>

<style scoped lang="scss" src="./tirages.scss" />
