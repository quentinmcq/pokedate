<script setup lang="ts">
import type { CalendarDate, PokemonDetail } from '#shared/types/pokemon'

const props = withDefaults(
  defineProps<{
    pokemon: PokemonDetail
    date?: CalendarDate | null
    shiny?: boolean
    animate?: boolean
    celebrate?: boolean
    headingLevel?: 'h1' | 'h2'
    newDiscovery?: boolean | null
  }>(),
  { date: null, shiny: false, animate: false, celebrate: true, headingLevel: 'h2', newDiscovery: null },
)

const REVEAL_DELAY_MS = 1300

const sectionHeadingTag = computed(() => (props.headingLevel === 'h1' ? 'h2' : 'h3'))

const { applyTypes } = usePageAccent()
applyTypes(props.pokemon.types)

const { recordDiscovery } = usePokedex()
const shareLink = useShareLink()
const absoluteUrl = useAbsoluteUrl()
const { t, formatLocalNumber } = useLocaleTools()
const localePath = useLocalePath()

// This week's draws come from the shared feed: they are fetched in the browser, after the card shows.
const POPULAR_THRESHOLD = 2
const weekRevealCount = ref(0)
onMounted(async () => {
  const reveals = await $fetch<{ weekCount: number }>(`/api/pokemon/${props.pokemon.id}/reveals`).catch(() => null)
  weekRevealCount.value = reveals?.weekCount ?? 0
})

const isShinyShown = ref(props.shiny)
watch(
  () => props.shiny,
  (shiny) => (isShinyShown.value = shiny),
)

const isRevealed = ref(!props.animate)
const areStatBarsFilled = ref(false)
const isNewDiscovery = ref(false)

const primaryType = computed(() => props.pokemon.types[0])
const generation = computed(() => generationOf(props.pokemon.generation))
const hasEvolutions = computed(() => props.pokemon.evolutionStages.flat().length > 1)

function celebrateReveal() {
  if (isShinyShown.value) launchGoldConfetti()
  else if (props.pokemon.rarity) launchTypeConfetti(primaryType.value)
}

function reveal() {
  if (areStatBarsFilled.value) return
  isRevealed.value = true
  areStatBarsFilled.value = true
  if (props.celebrate) celebrateReveal()
}

let revealTimer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  if (props.newDiscovery === null)
    isNewDiscovery.value = recordDiscovery(props.pokemon.id, { shiny: isShinyShown.value })
  if (props.animate) revealTimer = setTimeout(reveal, REVEAL_DELAY_MS)
  else requestAnimationFrame(() => requestAnimationFrame(reveal))
})
onBeforeUnmount(() => clearTimeout(revealTimer))

function revealNow() {
  clearTimeout(revealTimer)
  reveal()
}

function sharePokemon() {
  const { id, name } = props.pokemon
  const query = new URLSearchParams({ partage: '1' })
  if (isShinyShown.value) query.set('shiny', '1')
  const shinySuffix = isShinyShown.value ? t('card.shareShinySuffix') : ''
  shareLink({
    text: props.date ? t('card.shareMyDate', { name, id, shiny: shinySuffix }) : t('card.shareDiscover', { name, id }),
    url: `${absoluteUrl(localePath(pokemonPath(props.pokemon)))}?${query}`,
  })
}
</script>

<template>
  <article
    class="mon-card"
    :style="{ '--accent': typeColor(primaryType) }"
    :aria-labelledby="`pokemon-${pokemon.id}-name`"
  >
    <div class="mon-card__grid" :class="{ 'mon-card__grid--no-evolutions': !hasEvolutions }">
      <PokemonArtwork
        v-model:shiny="isShinyShown"
        class="mon-card__artwork"
        :pokemon="pokemon"
        :revealed="isRevealed"
        :shows-shiny-badge="!!date && shiny"
        @reveal-now="revealNow"
      />

      <header class="mon-card__header">
        <div class="mon-card__id">
          <span>{{ t('card.number', { number: padNumber(pokemon.id, 4) }) }}</span>
          <span v-if="generation">{{
            t('card.generation', { roman: generation.roman, region: t(`regions.${generation.region}`) })
          }}</span>
          <span v-if="pokemon.rarity === 'legendary'" class="tag">{{ t('card.legendary') }}</span>
          <span v-if="pokemon.rarity === 'mythical'" class="tag tag--myth">{{ t('card.mythical') }}</span>
          <span v-if="pokemon.isBaby" class="tag tag--baby">{{ t('card.baby') }}</span>
          <span v-if="newDiscovery ?? isNewDiscovery" class="tag tag--new">{{ t('card.new') }}</span>
        </div>
        <component :is="headingLevel" :id="`pokemon-${pokemon.id}-name`" class="mon-card__name">
          {{ pokemon.name }}<small>{{ pokemon.genus }}</small>
        </component>
        <div class="chip-list">
          <TypeChip v-for="type in pokemon.types" :key="type" :type="type" />
        </div>
        <p v-if="weekRevealCount >= POPULAR_THRESHOLD" class="mon-card__popularity">
          <Icon name="lucide:users-round" aria-hidden="true" />
          {{ t('card.weekReveals', { count: weekRevealCount }) }}
        </p>
        <div class="mon-card__actions">
          <button class="btn btn--primary btn--sm" type="button" @click="sharePokemon">
            <Icon name="lucide:share-2" aria-hidden="true" /> {{ t('common.share') }}
          </button>
          <NuxtLinkLocale
            v-if="date"
            class="btn btn--ghost btn--sm"
            :to="{ path: '/duel', query: { a: toIsoDate(date) } }"
            ><Icon name="lucide:swords" aria-hidden="true" /> {{ t('card.challenge') }}</NuxtLinkLocale
          >
        </div>
        <slot name="after-actions" :revealed="isRevealed" />
      </header>

      <p v-if="pokemon.description" class="mon-card__summary">{{ pokemon.description }}</p>

      <dl class="mon-card__facts">
        <div class="mon-card__fact">
          <dt>{{ t('card.height') }}</dt>
          <dd>{{ formatLocalNumber(pokemon.heightMeters) }} m</dd>
        </div>
        <div class="mon-card__fact">
          <dt>{{ t('card.weight') }}</dt>
          <dd>{{ formatLocalNumber(pokemon.weightKg) }} kg</dd>
        </div>
        <div class="mon-card__fact mon-card__fact--wide">
          <dt>{{ t('card.abilities') }}</dt>
          <dd class="mon-card__abilities">
            <span v-for="ability in pokemon.abilities" :key="ability.name" class="mon-card__ability">
              {{ ability.name
              }}<span v-if="ability.hidden" class="mon-card__hidden-ability">{{ t('card.hiddenAbility') }}</span>
            </span>
          </dd>
        </div>
      </dl>

      <section class="mon-card__stats">
        <component :is="sectionHeadingTag" class="mon-card__section-title">{{ t('card.baseStats') }}</component>
        <PokemonStatBars :stats="pokemon.stats" :filled="areStatBarsFilled" />
      </section>

      <section class="mon-card__matchups">
        <component :is="sectionHeadingTag" class="mon-card__section-title">{{ t('card.matchups') }}</component>
        <PokemonMatchups :types="pokemon.types" />
      </section>

      <section v-if="hasEvolutions" class="mon-card__evolutions">
        <component :is="sectionHeadingTag" class="mon-card__section-title">{{ t('card.evolutions') }}</component>
        <PokemonEvolutions :stages="pokemon.evolutionStages" :current-id="pokemon.id" />
      </section>
    </div>
  </article>
</template>

<style scoped lang="scss" src="./PokemonCard.scss" />
