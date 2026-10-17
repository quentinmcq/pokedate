<script setup lang="ts">
import type { CalendarDate, PokemonDetail } from '#shared/types/pokemon'

const props = withDefaults(
  defineProps<{
    pokemon: PokemonDetail
    date?: CalendarDate | null
    shiny?: boolean
    animate?: boolean
    headingLevel?: 'h1' | 'h2'
    catchOnReveal?: boolean
  }>(),
  { date: null, shiny: false, animate: false, headingLevel: 'h2', catchOnReveal: false },
)

const REVEAL_DELAY_MS = 1300
const SPARKLE_COUNT = 8
const SPARKLE_DURATION_MS = 2400
const SHINY_CONFETTI = ['#ffd23f', '#fff3b0', '#ffffff']

const sectionHeadingTag = computed(() => (props.headingLevel === 'h1' ? 'h2' : 'h3'))

const { applyTypes } = usePageAccent()
applyTypes(props.pokemon.types)

const { recordDiscovery } = usePokedex()
const shareLink = useShareLink()
const absoluteUrl = useAbsoluteUrl()
const { showToast } = useToast()

const isShinyShown = ref(props.shiny)
watch(
  () => props.shiny,
  (shiny) => (isShinyShown.value = shiny),
)

const isRevealed = ref(!props.animate)
const areStatBarsFilled = ref(false)
const isNewDiscovery = ref(false)
const sparkles = ref<{ id: number; left: number; top: number; delay: number }[]>([])

const primaryType = computed(() => props.pokemon.types[0])
const generation = computed(() => generationOf(props.pokemon.generation))
const hasEvolutions = computed(() => props.pokemon.evolutionStages.flat().length > 1)

function reveal() {
  if (areStatBarsFilled.value) return
  isRevealed.value = true
  areStatBarsFilled.value = true
  if (isShinyShown.value) launchConfetti(SHINY_CONFETTI)
  else if (props.pokemon.rarity) launchConfetti([typeColor(primaryType.value), '#ffd23f', '#ffffff'])
}

let revealTimer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  isNewDiscovery.value = recordDiscovery(props.pokemon.id, { caught: props.catchOnReveal, shiny: isShinyShown.value })
  if (props.animate) revealTimer = setTimeout(reveal, REVEAL_DELAY_MS)
  else requestAnimationFrame(() => requestAnimationFrame(reveal))
})
onBeforeUnmount(() => clearTimeout(revealTimer))

function revealNow() {
  clearTimeout(revealTimer)
  reveal()
}

function playCry(event: MouseEvent) {
  new Audio(cryUrl(props.pokemon.id)).play().catch(() => showToast('Cri indisponible sur ce navigateur'))
  ;(event.currentTarget as HTMLElement).animate([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], 300)
}

function toggleShiny() {
  isShinyShown.value = !isShinyShown.value
  if (!isShinyShown.value) return
  sparkles.value = Array.from({ length: SPARKLE_COUNT }, (_, index) => ({
    id: Date.now() + index,
    left: 15 + Math.random() * 70,
    top: 15 + Math.random() * 60,
    delay: Math.random() * 0.6,
  }))
  setTimeout(() => (sparkles.value = []), SPARKLE_DURATION_MS)
}

function sharePokemon() {
  const { id, name } = props.pokemon
  const query = new URLSearchParams({ partage: '1' })
  if (isShinyShown.value) query.set('shiny', '1')
  const shinySuffix = isShinyShown.value ? ' en version shiny ✨' : ''
  shareLink({
    text: props.date
      ? `Ma date me donne ${name} (#${id})${shinySuffix} ! Et toi, quel Pokémon se cache dans ta date ?`
      : `Découvre ${name} (#${id}) sur PokéDate !`,
    url: `${absoluteUrl(pokemonPath(props.pokemon))}?${query}`,
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
      <div class="mon-card__stage" :class="{ 'mon-card__stage--hidden': !isRevealed }">
        <span class="mon-card__bignum" aria-hidden="true">{{ padNumber(pokemon.id, 4) }}</span>
        <div class="mon-card__halo" aria-hidden="true" />
        <img
          class="mon-card__art"
          :src="artworkUrl(pokemon.id, isShinyShown)"
          :alt="isShinyShown ? `${pokemon.name} (shiny)` : pokemon.name"
          width="320"
          height="320"
          fetchpriority="high"
          decoding="async"
        />
        <span class="mon-card__who" aria-hidden="true">Qui est-ce&nbsp;?</span>
        <PokeBall class="mon-card__reveal-ball" :size="46" />
        <button
          v-if="!isRevealed"
          class="mon-card__skip"
          type="button"
          aria-label="Révéler le Pokémon tout de suite"
          @click="revealNow"
        />
        <span
          v-for="sparkle in sparkles"
          :key="sparkle.id"
          class="mon-card__sparkle"
          aria-hidden="true"
          :style="{ left: `${sparkle.left}%`, top: `${sparkle.top}%`, animationDelay: `${sparkle.delay}s` }"
          ><Icon name="lucide:sparkle"
        /></span>
        <div class="mon-card__tools">
          <button class="icon-btn" type="button" title="Écouter son cri" aria-label="Écouter son cri" @click="playCry">
            <Icon name="lucide:volume-2" aria-hidden="true" />
          </button>
          <button
            class="icon-btn"
            type="button"
            :aria-pressed="isShinyShown"
            title="Version chromatique (shiny)"
            aria-label="Afficher la version shiny"
            @click="toggleShiny"
          >
            <Icon name="lucide:sparkles" aria-hidden="true" />
          </button>
        </div>
        <span v-if="date && shiny" class="mon-card__shiny-badge"
          ><Icon name="lucide:sparkles" aria-hidden="true" /> Shiny ! 1 date sur 20</span
        >
      </div>

      <header class="mon-card__header">
        <div class="mon-card__id">
          <span>N° {{ padNumber(pokemon.id, 4) }}</span>
          <span v-if="generation">Gén. {{ generation.roman }} ({{ generation.region }})</span>
          <span v-if="pokemon.rarity === 'legendary'" class="tag">Légendaire</span>
          <span v-if="pokemon.rarity === 'mythical'" class="tag tag--myth">Fabuleux</span>
          <span v-if="pokemon.isBaby" class="tag tag--baby">Bébé</span>
          <span v-if="isNewDiscovery" class="tag tag--new">Nouveau !</span>
        </div>
        <component :is="headingLevel" :id="`pokemon-${pokemon.id}-name`" class="mon-card__name">
          {{ pokemon.name }}<small>{{ pokemon.englishName }} · {{ pokemon.genus }}</small>
        </component>
        <div class="chip-list">
          <TypeChip v-for="type in pokemon.types" :key="type" :type="type" />
        </div>
        <div class="mon-card__actions">
          <button class="btn btn--primary btn--sm" type="button" @click="sharePokemon">
            <Icon name="lucide:share-2" aria-hidden="true" /> Partager
          </button>
          <NuxtLink v-if="date" class="btn btn--ghost btn--sm" :to="{ path: '/duel', query: { a: toIsoDate(date) } }"
            ><Icon name="lucide:swords" aria-hidden="true" /> Défier un ami</NuxtLink
          >
        </div>
      </header>

      <p class="mon-card__summary">{{ pokemon.description }}</p>

      <dl class="mon-card__facts">
        <div class="mon-card__fact">
          <dt>Taille</dt>
          <dd>
            {{ formatNumber(pokemon.heightMeters) }} m
            <span class="mon-card__hint">{{ describeHeight(pokemon.heightMeters) }}</span>
          </dd>
        </div>
        <div class="mon-card__fact">
          <dt>Poids</dt>
          <dd>{{ formatNumber(pokemon.weightKg) }} kg</dd>
        </div>
        <div class="mon-card__fact mon-card__fact--wide">
          <dt>Talents</dt>
          <dd class="mon-card__abilities">
            <span v-for="ability in pokemon.abilities" :key="ability.name" class="mon-card__ability">
              {{ ability.name }}<span v-if="ability.hidden" class="mon-card__hidden-ability">talent caché</span>
            </span>
          </dd>
        </div>
      </dl>

      <section class="mon-card__stats">
        <component :is="sectionHeadingTag" class="mon-card__section-title">Statistiques de base</component>
        <PokemonStatBars :stats="pokemon.stats" :filled="areStatBarsFilled" />
      </section>

      <section class="mon-card__matchups">
        <component :is="sectionHeadingTag" class="mon-card__section-title">Types face à lui</component>
        <PokemonMatchups :types="pokemon.types" />
      </section>

      <section v-if="hasEvolutions" class="mon-card__evolutions">
        <component :is="sectionHeadingTag" class="mon-card__section-title">Évolutions</component>
        <PokemonEvolutions :stages="pokemon.evolutionStages" :current-id="pokemon.id" />
      </section>
    </div>
  </article>
</template>

<style scoped lang="scss" src="./PokemonCard.scss" />
