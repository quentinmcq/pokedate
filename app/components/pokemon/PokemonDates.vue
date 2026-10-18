<script setup lang="ts">
import type { CalendarDate } from '#shared/types/pokemon'

const props = defineProps<{ pokemonId: number; pokemonName: string; today: CalendarDate }>()

const YEARS_SHOWN = 3

const { t, locale } = useLocaleTools()
const localeTag = computed(() => LOCALE_TAGS[locale.value])
const listFormat = computed(() => new Intl.ListFormat(localeTag.value, { type: 'disjunction' }))
const monthFormat = computed(() => new Intl.DateTimeFormat(localeTag.value, { month: 'long', timeZone: 'UTC' }))
const longDateFormat = computed(
  () =>
    new Intl.DateTimeFormat(localeTag.value, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
)

const asUtcDate = ({ day, month, year }: CalendarDate) => new Date(Date.UTC(year, month - 1, day))
const shortDate = ({ day, month, year }: CalendarDate) => `${padNumber(day)}/${padNumber(month)}/${year}`
const monthName = (month: number) => monthFormat.value.format(asUtcDate({ day: 1, month, year: 2000 }))

const digits = computed(() => dateDigitsForPokemon(props.pokemonId))
const monthsAllowed = computed(() => (digits.value ? monthsEndingWith(digits.value.month) : []))
const dayChoices = computed(() =>
  digits.value ? listFormat.value.format(daysEndingWith(digits.value.day).map((day) => padNumber(day))) : '',
)
const monthChoices = computed(() => listFormat.value.format(monthsAllowed.value.map(monthName)))
const yearChoices = computed(() => {
  if (!digits.value) return ''
  const latestYear = props.today.year - ((props.today.year - digits.value.year + 10) % 10)
  const years = Array.from({ length: YEARS_SHOWN }, (_, index) => latestYear + (index - 1) * 10)
  return `${years.join(', ')}…`
})

const nextDate = computed(() => nextDateForPokemon(props.pokemonId, props.today))
const isToday = computed(() => !!nextDate.value && toIsoDate(nextDate.value) === toIsoDate(props.today))
const examples = computed(() => exampleDatesForPokemon(props.pokemonId).map(shortDate).join(' · '))
</script>

<template>
  <section class="pokemon-dates" aria-labelledby="pokemon-dates-title">
    <h2 id="pokemon-dates-title">{{ t('dates.title', { name: pokemonName }) }}</h2>
    <template v-if="digits">
      <p>{{ t('dates.intro', { name: pokemonName }) }}</p>
      <ul class="pokemon-dates__rules">
        <i18n-t keypath="dates.dayRule" tag="li" scope="global">
          <template #digit
            ><b>{{ digits.day }}</b></template
          >
          <template #choices>{{ dayChoices }}</template>
        </i18n-t>
        <i18n-t v-if="monthsAllowed.length > 1" keypath="dates.monthRule" tag="li" scope="global">
          <template #digit
            ><b>{{ digits.month }}</b></template
          >
          <template #choices>{{ monthChoices }}</template>
        </i18n-t>
        <i18n-t v-else keypath="dates.singleMonthRule" tag="li" scope="global">
          <template #month
            ><b>{{ monthChoices }}</b></template
          >
        </i18n-t>
        <i18n-t keypath="dates.yearRule" tag="li" scope="global">
          <template #digit
            ><b>{{ digits.year }}</b></template
          >
          <template #choices>{{ yearChoices }}</template>
        </i18n-t>
      </ul>
    </template>
    <i18n-t v-else keypath="dates.bonus" tag="p" scope="global">
      <template #name>{{ pokemonName }}</template>
      <template #mirrorDate
        ><b>{{ t('dates.mirrorDate') }}</b></template
      >
    </i18n-t>
    <dl class="pokemon-dates__facts">
      <div v-if="nextDate" class="pokemon-dates__fact">
        <dt>{{ t('dates.next') }}</dt>
        <dd>
          <time :datetime="toIsoDate(nextDate)">{{
            isToday ? t('dates.today') : longDateFormat.format(asUtcDate(nextDate))
          }}</time>
        </dd>
      </div>
      <div class="pokemon-dates__fact">
        <dt>{{ t('dates.examples') }}</dt>
        <dd>{{ examples }}</dd>
      </div>
    </dl>
    <NuxtLinkLocale to="/" class="btn btn--ghost btn--sm">{{ t('dates.tryYours') }}</NuxtLinkLocale>
  </section>
</template>

<style scoped lang="scss" src="./PokemonDates.scss" />
