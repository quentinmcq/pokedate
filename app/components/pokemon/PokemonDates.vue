<script setup lang="ts">
import type { CalendarDate } from '#shared/types/pokemon'

const props = defineProps<{ pokemonId: number; pokemonName: string; today: CalendarDate }>()

const YEARS_SHOWN = 3

const listFormat = new Intl.ListFormat('fr-FR', { type: 'disjunction' })
const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', timeZone: 'UTC' })
const longDateFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const asUtcDate = ({ day, month, year }: CalendarDate) => new Date(Date.UTC(year, month - 1, day))
const shortDate = ({ day, month, year }: CalendarDate) => `${padNumber(day)}/${padNumber(month)}/${year}`
const monthName = (month: number) => monthFormat.format(asUtcDate({ day: 1, month, year: 2000 }))

const digits = computed(() => dateDigitsForPokemon(props.pokemonId))
const monthsAllowed = computed(() => (digits.value ? monthsEndingWith(digits.value.month) : []))
const dayChoices = computed(() =>
  digits.value ? listFormat.format(daysEndingWith(digits.value.day).map((day) => padNumber(day))) : '',
)
const monthChoices = computed(() => listFormat.format(monthsAllowed.value.map(monthName)))
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
    <h2 id="pokemon-dates-title">Quelles dates donnent {{ pokemonName }}&nbsp;?</h2>
    <template v-if="digits">
      <p>Ta date donne {{ pokemonName }} quand&nbsp;:</p>
      <ul class="pokemon-dates__rules">
        <li>
          le jour finit par <b>{{ digits.day }}</b> ({{ dayChoices }})&nbsp;;
        </li>
        <li v-if="monthsAllowed.length > 1">
          le mois finit par <b>{{ digits.month }}</b> ({{ monthChoices }})&nbsp;;
        </li>
        <li v-else>
          le mois est <b>{{ monthChoices }}</b
          >&nbsp;;
        </li>
        <li>
          l'année finit par <b>{{ digits.year }}</b> ({{ yearChoices }}).
        </li>
      </ul>
    </template>
    <p v-else>
      {{ pokemonName }} est un Pokémon bonus&nbsp;: il n'apparaît qu'avec une <b>date miroir</b>, quand le jour et le
      mois sont identiques (le 04/04, le 12/12…). Le jour et l'année décident lequel des 25 Pokémon bonus surgit.
    </p>
    <dl class="pokemon-dates__facts">
      <div v-if="nextDate" class="pokemon-dates__fact">
        <dt>Prochaine date</dt>
        <dd>
          <time :datetime="toIsoDate(nextDate)">{{
            isToday ? "Aujourd'hui !" : longDateFormat.format(asUtcDate(nextDate))
          }}</time>
        </dd>
      </div>
      <div class="pokemon-dates__fact">
        <dt>Exemples de dates de naissance</dt>
        <dd>{{ examples }}</dd>
      </div>
    </dl>
    <NuxtLink to="/" class="btn btn--ghost btn--sm">Tester ta date</NuxtLink>
  </section>
</template>

<style scoped lang="scss" src="./PokemonDates.scss" />
