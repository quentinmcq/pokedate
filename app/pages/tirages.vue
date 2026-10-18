<script setup lang="ts">
import type { DrawsActivity, PublicDraw } from '#shared/types/pokemon'

const REFRESH_INTERVAL_MS = 30_000

const { resetAccent } = usePageAccent()
const { t, locale } = useLocaleTools()
resetAccent()

const [{ data: draws, error, refresh: refreshDraws }, { data: activity, refresh: refreshActivity }] = await Promise.all(
  [
    useFetch<PublicDraw[]>('/api/draws', { key: () => `public-draws-${locale.value}`, query: { lang: locale } }),
    useFetch<DrawsActivity>('/api/activity', { key: () => `draws-activity-${locale.value}`, query: { lang: locale } }),
  ],
)

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
const nicknameOf = (draw: PublicDraw) => (draw.nickname === ANONYMOUS_NICKNAME ? t('common.anonymous') : draw.nickname)

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

    <h2 class="draws-title">{{ t('draws.listTitle') }}</h2>
    <p class="draws-hint">{{ t('draws.listHint') }}</p>

    <p v-if="error" class="draws-empty">{{ t('draws.unavailable') }}</p>
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
        <i18n-t
          :keypath="draw.bonusPokemon ? 'draws.drewWithBonus' : 'draws.drew'"
          tag="p"
          class="draws__text"
          scope="global"
        >
          <template #nickname
            ><b>{{ nicknameOf(draw) }}</b></template
          >
          <template #pokemon
            ><NuxtLinkLocale :to="drawLink(draw)">{{ draw.pokemonName }}</NuxtLinkLocale
            ><span v-if="draw.shiny" class="draws__shiny">
              <Icon name="lucide:sparkles" aria-hidden="true" /> shiny</span
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
