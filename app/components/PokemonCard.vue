<script setup lang="ts">
import type { CalendarDate, PokemonDetail } from '#shared/types/pokemon'

const props = withDefaults(
  defineProps<{
    pokemon: PokemonDetail
    date?: CalendarDate | null
    shiny?: boolean
    animate?: boolean
    headingLevel?: 'h1' | 'h2'
  }>(),
  { date: null, shiny: false, animate: false, headingLevel: 'h2' },
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
const personality = computed(
  () => `${TYPE_PERSONALITY[primaryType.value]} ${STAT_SUPERPOWER[strongestStat(props.pokemon.stats)]}`,
)
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
  isNewDiscovery.value = recordDiscovery(props.pokemon.id, { shiny: isShinyShown.value })
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
    <div class="mon-card__grid">
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

      <div class="mon-card__info">
        <div class="mon-card__id">
          N° {{ padNumber(pokemon.id, 4) }}
          <template v-if="generation">· Gén. {{ generation.roman }} ({{ generation.region }})</template>
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
        <p class="mon-card__desc">
          {{ pokemon.description
          }}<span v-if="pokemon.descriptionIsEnglish" class="mon-card__lang">(pas encore traduit en français)</span>
        </p>
        <p class="mon-card__horoscope">
          <strong>Si tu étais {{ pokemon.name }}…</strong> {{ personality }}
        </p>

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
            <dd>
              {{ formatNumber(pokemon.weightKg) }} kg
              <span class="mon-card__hint">{{ describeWeight(pokemon.weightKg) }}</span>
            </dd>
          </div>
          <div class="mon-card__fact">
            <dt>Talents</dt>
            <dd>
              <span v-for="ability in pokemon.abilities" :key="ability.name" class="mon-card__ability">
                {{ ability.name }}<span v-if="ability.hidden" class="mon-card__hint">(talent caché)</span>
              </span>
            </dd>
          </div>
        </dl>

        <section>
          <component :is="sectionHeadingTag" class="mon-card__section-title">Statistiques de base</component>
          <PokemonStatBars :stats="pokemon.stats" :filled="areStatBarsFilled" />
        </section>

        <section>
          <component :is="sectionHeadingTag" class="mon-card__section-title">Types face à lui</component>
          <PokemonMatchups :types="pokemon.types" />
        </section>

        <section v-if="hasEvolutions">
          <component :is="sectionHeadingTag" class="mon-card__section-title">Évolutions</component>
          <PokemonEvolutions :stages="pokemon.evolutionStages" :current-id="pokemon.id" />
        </section>

        <div class="mon-card__actions">
          <button class="btn btn--primary btn--sm" type="button" @click="sharePokemon">
            <Icon name="lucide:share-2" aria-hidden="true" /> Partager
          </button>
          <NuxtLink v-if="date" class="btn btn--ghost btn--sm" :to="{ path: '/duel', query: { a: toIsoDate(date) } }"
            ><Icon name="lucide:swords" aria-hidden="true" /> Défier un ami</NuxtLink
          >
          <NuxtLink v-if="date" class="btn btn--ghost btn--sm" :to="pokemonPath(pokemon)">Voir sa fiche</NuxtLink>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use '../assets/scss/abstracts/functions' as *;
@use '../assets/scss/abstracts/mixins' as *;

.mon-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--accent) 28%, var(--color-surface-2)),
    var(--color-surface-2) 55%
  );
  border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--color-line));
  border-radius: radius('xl');
  box-shadow: shadow('glow');
  animation: rise 0.5s ease-out;

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);

    @include bp(tablet) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  &__stage {
    position: sticky;
    top: space(3);
    align-self: start;
    display: grid;
    place-items: center;
    padding: space(8) space(5) space(2);
    min-height: 420px;
    cursor: default;

    @include bp(tablet) {
      position: relative;
      top: 0;
      min-height: 0;
      padding-top: space(12);
    }
    @include bp(phone) {
      min-height: 280px;
    }
  }

  &__bignum {
    position: absolute;
    top: 10px;
    left: 18px;
    font-family: var(--font-mono), monospace;
    font-weight: weight('bold');
    font-size: 4.5rem;
    line-height: 1;
    color: rgba(255, 255, 255, 0.07);
    letter-spacing: -0.04em;
    user-select: none;
  }

  &__halo {
    position: absolute;
    width: 78%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(circle, color-mix(in srgb, var(--accent) 55%, transparent), transparent 68%);
    filter: blur(6px);
  }

  &__art {
    position: relative;
    width: min(320px, 82%);
    height: auto;
    aspect-ratio: 1;
    object-fit: contain;
    filter: drop-shadow(0 18px 24px rgba(0, 0, 0, 0.45));
    transition:
      filter 0.7s ease,
      transform 0.7s ease('spring');
  }

  &__who {
    position: absolute;
    top: 40%;
    font-weight: weight('black');
    font-size: 1.6rem;
    letter-spacing: -0.02em;
    opacity: 0;
    pointer-events: none;
    text-shadow:
      0 3px 0 #2a5ad8,
      0 0 20px rgba(0, 0, 0, 0.6);
    color: color('highlight');
  }

  &__reveal-ball {
    position: absolute;
    bottom: space(5);
    opacity: 0;
  }

  &__skip {
    position: absolute;
    inset: 0;
    @include reset-button;
    border-radius: radius('xl');
    @include focus-ring(-6px);
  }

  &__stage--hidden {
    cursor: pointer;

    .mon-card__art {
      filter: brightness(0) drop-shadow(0 0 0 transparent);
      transform: scale(0.92);
    }
    .mon-card__who {
      opacity: 1;
      animation: pop 0.4s;
    }
    .mon-card__reveal-ball {
      opacity: 1;
      animation: shake 1.1s ease-in-out;
    }
  }

  &__tools {
    position: absolute;
    right: 14px;
    top: 14px;
    display: flex;
    gap: space(2);
    z-index: 1;
  }

  &__shiny-badge {
    position: absolute;
    left: 18px;
    bottom: space(4);
    background: color('highlight');
    color: color('on-light');
    font-weight: weight('black');
    padding: 6px 12px;
    border-radius: radius('pill');
    font-size: 0.85rem;
    animation: pop 0.5s;
  }

  &__sparkle {
    position: absolute;
    pointer-events: none;
    font-size: 1.4rem;
    color: #ffe680;
    animation: twinkle 1.6s ease-in-out infinite;
  }

  &__info {
    padding: space(6) space(6) space(6) space(2);
    display: flex;
    flex-direction: column;
    gap: space(5);
    min-width: 0;

    @include bp(tablet) {
      padding: space(2) space(5) space(6);
    }
  }

  &__id {
    font-family: var(--font-mono), monospace;
    color: color('text-muted');
    font-size: 0.95rem;
    display: flex;
    gap: space(3);
    align-items: center;
    flex-wrap: wrap;
  }

  &__name {
    margin: 2px 0 0;
    font-size: font-size('title');
    line-height: 1;
    letter-spacing: -0.04em;
    font-weight: weight('black');

    small {
      display: block;
      font-size: 0.95rem;
      letter-spacing: 0;
      color: color('text-muted');
      font-weight: weight('regular');
      margin-top: 6px;
    }
  }

  &__desc {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.5;
    color: #dcdcf5;
  }

  &__lang {
    font-size: 0.75rem;
    color: color('text-muted');
    margin-left: 6px;
  }

  &__horoscope {
    margin: 0;
    padding: 14px space(4);
    border-radius: radius('lg');
    background: rgba(255, 210, 63, 0.09);
    border: 1px dashed rgba(255, 210, 63, 0.5);
    line-height: 1.5;

    strong {
      color: color('highlight');
    }
  }

  &__facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
    margin: 0;
  }

  &__fact {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: radius('lg');
    padding: 10px space(3);

    dt {
      @include eyebrow;
    }
    dd {
      margin: 2px 0 0;
      font-weight: weight('bold');
    }
  }

  &__hint {
    display: block;
    font-size: 0.78rem;
    color: color('text-muted');
    font-weight: weight('regular');
    margin-top: 2px;
  }

  &__ability {
    display: block;
  }

  &__section-title {
    @include eyebrow;
    letter-spacing: 0.1em;
    font-weight: weight('bold');
    margin: 0 0 10px;
  }

  &__actions {
    display: flex;
    gap: space(2);
    flex-wrap: wrap;
  }
}

.tag {
  font-weight: weight('bold');
  font-size: 0.78rem;
  padding: 3px 10px;
  border-radius: radius('pill');
  background: color('highlight');
  color: color('on-light');
  font-family: var(--font-display), sans-serif;

  &--myth {
    background: linear-gradient(90deg, #ff7ce5, #8b7bff);
    color: #fff;
  }
  &--baby {
    background: color('baby');
  }
  &--new {
    background: color('success');
  }
}
</style>
