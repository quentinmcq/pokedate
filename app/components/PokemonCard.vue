<script setup lang="ts">
import type { DateParts, PokemonDetail } from '#shared/types/pokemon'

const props = defineProps<{
  pokemon: PokemonDetail
  /** date d'où vient le Pokémon (absente en mode exploration) */
  date?: DateParts | null
  shiny?: boolean
  /** révélation façon « Qui est-ce ? » */
  animate?: boolean
}>()

const p = computed(() => props.pokemon)
const { setAccent } = useAccent()
setAccent(props.pokemon.types)

const { catchPokemon } = useDex()
const share = useShare()
const absoluteUrl = useAbsoluteUrl()
const { show: toast } = useToast()

const showShiny = ref(!!props.shiny)
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
  if (props.date) {
    const { d, m } = props.date
    share(
      `Ma date (${padNumber(d)}/${padNumber(m)}) me donne ${p.value.fr} #${p.value.id}${showShiny.value ? ' ✨ SHINY' : ''} ! Et toi, quel Pokémon es-tu ?`,
      absoluteUrl('/', { date: toIsoDate(props.date) }),
    )
  } else {
    share(`Regarde ${p.value.fr} (#${p.value.id}) sur PokéDate !`, absoluteUrl(`/pokemon/${p.value.id}`))
  }
}
</script>

<template>
  <article class="card" :style="{ '--accent': typeColor(p.types[0]!) }">
    <div class="card-grid">
      <div class="stage" :class="{ 'hidden-mon': !revealed }" @click="skipReveal">
        <span class="bignum">{{ padNumber(p.id, 4) }}</span>
        <div class="halo" />
        <img class="art" :src="artUrl(p.id, showShiny)" :alt="p.fr" width="320" height="320" />
        <span class="who">Qui est-ce&nbsp;?</span>
        <span class="ball reveal-ball" aria-hidden="true" />
        <span
          v-for="s in sparkles"
          :key="s.id"
          class="sparkle"
          :style="{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s`, color: '#ffe680' }"
          >✦</span
        >
        <div class="tools">
          <button
            class="icon-btn"
            type="button"
            title="Écouter son cri"
            aria-label="Écouter son cri"
            @click.stop="playCry"
          >
            🔊
          </button>
          <button
            class="icon-btn"
            type="button"
            :aria-pressed="showShiny"
            title="Version chromatique (shiny)"
            aria-label="Version shiny"
            @click.stop="toggleShiny"
          >
            ✨
          </button>
        </div>
        <span v-if="date && shiny" class="shiny-badge">✨ Shiny ! 1 date sur 20</span>
      </div>

      <div class="info">
        <div class="id-line">
          N° {{ padNumber(p.id, 4) }} · Gén. {{ gen[0] }} ({{ gen[1] }})
          <span v-if="p.rare === 1" class="tag">Légendaire</span>
          <span v-if="p.rare === 2" class="tag myth">Fabuleux</span>
          <span v-if="p.baby" class="tag baby">Bébé</span>
          <span v-if="isNew" class="tag new">Nouveau !</span>
        </div>
        <h2 class="mon-name">
          {{ p.fr }}<small>{{ p.en }} · {{ p.genus }}</small>
        </h2>
        <div class="types">
          <TypeChip v-for="t in p.types" :key="t" :type="t" />
        </div>
        <p class="desc">{{ p.desc }}<span v-if="p.descEn" class="en">(pas encore traduit en français)</span></p>
        <p class="horoscope">
          <strong>Si tu étais {{ p.fr }}…</strong> {{ TYPE_TRAIT[p.types[0]!] }} {{ STAT_TRAIT[best] }}
        </p>

        <div class="facts">
          <div class="fact">
            <div class="k">Taille</div>
            <div class="v">{{ formatNumber(p.h) }} m</div>
            <div class="hint">{{ heightHint(p.h) }}</div>
          </div>
          <div class="fact">
            <div class="k">Poids</div>
            <div class="v">{{ formatNumber(p.w) }} kg</div>
            <div class="hint">{{ weightHint(p.w) }}</div>
          </div>
          <div class="fact">
            <div class="k">Talents</div>
            <div class="v">
              <div v-for="[name, hidden] in p.ab" :key="name">
                {{ name }} <span v-if="hidden" class="hint">(caché)</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p class="block-title">Statistiques de base</p>
          <div class="stats">
            <template v-for="(v, i) in p.stats" :key="i">
              <span class="lbl">{{ STAT_LABELS[i] }}</span>
              <span class="val">{{ v }}</span>
              <div class="bar">
                <i
                  :class="{ best: i === best }"
                  :style="{ width: barsOn ? `${Math.min(100, (v / 200) * 100)}%` : '0' }"
                />
              </div>
            </template>
            <div class="total">
              <span>Total</span><span>{{ total }}</span>
            </div>
          </div>
        </div>

        <div>
          <p class="block-title">Types face à lui</p>
          <div class="matchups">
            <div v-if="matchups.weak.length" class="row">
              <em>Faible contre</em><TypeChip v-for="[t, m] in matchups.weak" :key="t" :type="t" :mult="m" small />
            </div>
            <div v-if="matchups.resist.length" class="row">
              <em>Résiste à</em><TypeChip v-for="[t, m] in matchups.resist" :key="t" :type="t" :mult="m" small />
            </div>
            <div v-if="matchups.immune.length" class="row">
              <em>Immunisé contre</em><TypeChip v-for="[t, m] in matchups.immune" :key="t" :type="t" :mult="m" small />
            </div>
          </div>
        </div>

        <div v-if="hasEvolutions">
          <p class="block-title">Évolutions</p>
          <div class="evo" :class="{ many: manyBranches }">
            <template v-for="(stage, i) in p.chain" :key="i">
              <span v-if="i" class="arrow">→</span>
              <div class="stage-col">
                <NuxtLink v-for="e in stage" :key="e.id" :to="`/pokemon/${e.id}`" :class="{ current: e.id === p.id }">
                  <img
                    loading="lazy"
                    :src="miniUrl(e.id)"
                    alt=""
                    @error="($event.target as HTMLImageElement).src = artUrl(e.id)"
                  />
                  {{ e.fr }}
                </NuxtLink>
              </div>
            </template>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn primary small" type="button" @click="onShare">Partager 📤</button>
          <NuxtLink v-if="date" class="btn ghost small" :to="{ path: '/duel', query: { a: toIsoDate(date) } }"
            >Défier un ami ⚔️</NuxtLink
          >
        </div>
      </div>
    </div>
  </article>
</template>
