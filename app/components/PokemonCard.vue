<script setup lang="ts">
import type { DateParts, PokemonDetail } from '#shared/types/pokemon'

const props = withDefaults(
  defineProps<{
    pokemon: PokemonDetail
    date?: DateParts | null
    shiny?: boolean
    animate?: boolean
    headingLevel?: 'h1' | 'h2'
  }>(),
  { date: null, shiny: false, animate: false, headingLevel: 'h2' },
)

const p = computed(() => props.pokemon)
const sectionHeading = computed(() => (props.headingLevel === 'h1' ? 'h2' : 'h3'))
const { setAccent } = useAccent()
setAccent(props.pokemon.types)

const { catchPokemon } = useDex()
const share = useShare()
const siteUrl = useSiteUrl()
const { show: toast } = useToast()

const showShiny = ref(props.shiny)
watch(
  () => props.shiny,
  (v) => (showShiny.value = v),
)
const revealed = ref(!props.animate)
const barsOn = ref(false)
const isNew = ref(false)
const sparkles = ref<{ id: number; left: number; top: number; delay: number }[]>([])

const total = computed(() => p.value.stats.reduce((a, b) => a + b, 0))
const best = computed(() => p.value.stats.indexOf(Math.max(...p.value.stats)))
const gen = computed(() => GENS[p.value.gen] ?? ['?', '?'])
const matchups = computed(() => matchupsFor(p.value.types))
const hasEvolutions = computed(() => p.value.chain.flat().length > 1)
const manyBranches = computed(() => p.value.chain.some((s) => s.length > 3))

function reveal() {
  if (barsOn.value) return
  revealed.value = true
  barsOn.value = true
  if (showShiny.value || p.value.rare)
    launchConfetti(
      showShiny.value ? ['#ffd23f', '#fff3b0', '#ffffff'] : [typeColor(p.value.types[0]!), '#ffd23f', '#ffffff'],
    )
}

let timer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  isNew.value = catchPokemon(p.value.id, showShiny.value)
  if (props.animate) timer = setTimeout(reveal, 1300)
  else requestAnimationFrame(() => requestAnimationFrame(reveal))
})
onBeforeUnmount(() => clearTimeout(timer))

function skipReveal() {
  clearTimeout(timer)
  reveal()
}

function playCry(e: MouseEvent) {
  new Audio(cryUrl(p.value.id)).play().catch(() => toast('Cri indisponible sur ce navigateur 🙉'))
  ;(e.currentTarget as HTMLElement).animate([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], 300)
}

function toggleShiny() {
  showShiny.value = !showShiny.value
  if (!showShiny.value) return
  sparkles.value = Array.from({ length: 8 }, (_, i) => ({
    id: Date.now() + i,
    left: 15 + Math.random() * 70,
    top: 15 + Math.random() * 60,
    delay: Math.random() * 0.6,
  }))
  setTimeout(() => (sparkles.value = []), 2400)
}

function onShare() {
  const query = new URLSearchParams({ partage: '1' })
  if (showShiny.value) query.set('shiny', '1')
  const url = `${siteUrl(pokemonPath(p.value))}?${query}`
  share(
    props.date
      ? `Ma date me donne ${p.value.fr} (#${p.value.id})${showShiny.value ? ' en version shiny ✨' : ''} ! Et toi, quel Pokémon se cache dans ta date ?`
      : `Découvre ${p.value.fr} (#${p.value.id}) sur PokéDate !`,
    url,
  )
}
</script>

<template>
  <article class="mon-card" :style="{ '--accent': typeColor(p.types[0]!) }" :aria-labelledby="`mon-${p.id}`">
    <div class="mon-card__grid">
      <div class="mon-card__stage" :class="{ 'mon-card__stage--hidden': !revealed }">
        <span class="mon-card__bignum" aria-hidden="true">{{ padNumber(p.id, 4) }}</span>
        <div class="mon-card__halo" aria-hidden="true" />
        <img
          class="mon-card__art"
          :src="artUrl(p.id, showShiny)"
          :alt="`${p.fr}${showShiny ? ' (shiny)' : ''}`"
          width="320"
          height="320"
          fetchpriority="high"
          decoding="async"
        />
        <span class="mon-card__who" aria-hidden="true">Qui est-ce&nbsp;?</span>
        <span class="ball mon-card__reveal-ball" aria-hidden="true" />
        <button
          v-if="!revealed"
          class="mon-card__skip"
          type="button"
          aria-label="Révéler le Pokémon tout de suite"
          @click="skipReveal"
        />
        <span
          v-for="s in sparkles"
          :key="s.id"
          class="mon-card__sparkle"
          aria-hidden="true"
          :style="{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }"
          >✦</span
        >
        <div class="mon-card__tools">
          <button class="icon-btn" type="button" title="Écouter son cri" aria-label="Écouter son cri" @click="playCry">
            🔊
          </button>
          <button
            class="icon-btn"
            type="button"
            :aria-pressed="showShiny"
            title="Version chromatique (shiny)"
            aria-label="Afficher la version shiny"
            @click="toggleShiny"
          >
            ✨
          </button>
        </div>
        <span v-if="date && shiny" class="mon-card__shiny-badge">✨ Shiny ! 1 date sur 20</span>
      </div>

      <div class="mon-card__info">
        <div class="mon-card__id">
          N° {{ padNumber(p.id, 4) }} · Gén. {{ gen[0] }} ({{ gen[1] }})
          <span v-if="p.rare === 1" class="tag">Légendaire</span>
          <span v-if="p.rare === 2" class="tag tag--myth">Fabuleux</span>
          <span v-if="p.baby" class="tag tag--baby">Bébé</span>
          <span v-if="isNew" class="tag tag--new">Nouveau !</span>
        </div>
        <component :is="headingLevel" :id="`mon-${p.id}`" class="mon-card__name">
          {{ p.fr }}<small>{{ p.en }} · {{ p.genus }}</small>
        </component>
        <div class="chip-list">
          <TypeChip v-for="t in p.types" :key="t" :type="t" />
        </div>
        <p class="mon-card__desc">
          {{ p.desc }}<span v-if="p.descEn" class="mon-card__lang">(pas encore traduit en français)</span>
        </p>
        <p class="mon-card__horoscope">
          <strong>Si tu étais {{ p.fr }}…</strong> {{ TYPE_TRAIT[p.types[0]!] }} {{ STAT_TRAIT[best] }}
        </p>

        <dl class="mon-card__facts">
          <div class="mon-card__fact">
            <dt>Taille</dt>
            <dd>
              {{ formatNumber(p.h) }} m<span class="mon-card__hint">{{ heightHint(p.h) }}</span>
            </dd>
          </div>
          <div class="mon-card__fact">
            <dt>Poids</dt>
            <dd>
              {{ formatNumber(p.w) }} kg<span class="mon-card__hint">{{ weightHint(p.w) }}</span>
            </dd>
          </div>
          <div class="mon-card__fact">
            <dt>Talents</dt>
            <dd>
              <span v-for="[name, hidden] in p.ab" :key="name"
                >{{ name }}<span v-if="hidden" class="mon-card__hint">(talent caché)</span><br
              /></span>
            </dd>
          </div>
        </dl>

        <section>
          <component :is="sectionHeading" class="mon-card__section-title">Statistiques de base</component>
          <dl class="stat-bars">
            <template v-for="(v, i) in p.stats" :key="i">
              <dt>{{ STAT_LABELS[i] }}</dt>
              <dd>
                <span class="stat-bars__val">{{ v }}</span>
                <span class="stat-bars__track" aria-hidden="true"
                  ><span
                    class="stat-bars__fill"
                    :class="{ 'stat-bars__fill--best': i === best }"
                    :style="{ width: barsOn ? `${Math.min(100, (v / 200) * 100)}%` : '0' }"
                /></span>
              </dd>
            </template>
          </dl>
          <p class="stat-bars__total">
            <span>Total</span><span>{{ total }}</span>
          </p>
        </section>

        <section>
          <component :is="sectionHeading" class="mon-card__section-title">Types face à lui</component>
          <div class="matchups">
            <div v-if="matchups.weak.length" class="chip-list">
              <span class="matchups__label">Faible contre</span>
              <TypeChip v-for="[t, m] in matchups.weak" :key="t" :type="t" :mult="m" small />
            </div>
            <div v-if="matchups.resist.length" class="chip-list">
              <span class="matchups__label">Résiste à</span>
              <TypeChip v-for="[t, m] in matchups.resist" :key="t" :type="t" :mult="m" small />
            </div>
            <div v-if="matchups.immune.length" class="chip-list">
              <span class="matchups__label">Immunisé contre</span>
              <TypeChip v-for="[t, m] in matchups.immune" :key="t" :type="t" :mult="m" small />
            </div>
          </div>
        </section>

        <section v-if="hasEvolutions">
          <component :is="sectionHeading" class="mon-card__section-title">Évolutions</component>
          <div class="evo" :class="{ 'evo--many': manyBranches }">
            <template v-for="(stage, i) in p.chain" :key="i">
              <span v-if="i" class="evo__arrow" aria-hidden="true">→</span>
              <div class="evo__stage">
                <NuxtLink
                  v-for="e in stage"
                  :key="e.id"
                  class="evo__link"
                  :to="pokemonPath(e)"
                  :aria-current="e.id === p.id ? 'page' : undefined"
                >
                  <img loading="lazy" decoding="async" :src="miniUrl(e.id)" alt="" width="56" height="56" />
                  {{ e.fr }}
                </NuxtLink>
              </div>
            </template>
          </div>
        </section>

        <div class="mon-card__actions">
          <button class="btn btn--primary btn--sm" type="button" @click="onShare">Partager 📤</button>
          <NuxtLink v-if="date" class="btn btn--ghost btn--sm" :to="{ path: '/duel', query: { a: toIsoDate(date) } }"
            >Défier un ami ⚔️</NuxtLink
          >
          <NuxtLink v-if="date" class="btn btn--ghost btn--sm" :to="pokemonPath(p)">Voir sa fiche</NuxtLink>
        </div>
      </div>
    </div>
  </article>
</template>
