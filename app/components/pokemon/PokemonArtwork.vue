<script setup lang="ts">
import type { PokemonDetail } from '#shared/types/pokemon'

const props = defineProps<{
  pokemon: Pick<PokemonDetail, 'id' | 'name'>
  revealed: boolean
  showsShinyBadge: boolean
}>()
const emit = defineEmits<{ revealNow: [] }>()
const isShinyShown = defineModel<boolean>('shiny', { required: true })

const SPARKLE_COUNT = 8
const SPARKLE_DURATION_MS = 2400

const { showToast } = useToast()
const { t } = useLocaleTools()

const sparkles = ref<{ id: number; left: number; top: number; delay: number }[]>([])

// Fetched once the artwork shows, after its own image, so the shiny button swaps the image at once.
function preloadOtherArtwork() {
  const otherArtwork = new Image()
  otherArtwork.src = artworkUrl(props.pokemon.id, !isShinyShown.value)
}

onMounted(() =>
  watch(
    () => props.revealed,
    (revealed) => revealed && preloadOtherArtwork(),
    { immediate: true },
  ),
)

function playCry(event: MouseEvent) {
  new Audio(cryUrl(props.pokemon.id)).play().catch(() => showToast(t('card.cryUnavailable')))
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
</script>

<template>
  <div class="pokemon-artwork" :class="{ 'pokemon-artwork--hidden': !revealed }">
    <span class="pokemon-artwork__bignum" aria-hidden="true">{{ padNumber(pokemon.id, 4) }}</span>
    <div class="pokemon-artwork__halo" aria-hidden="true" />
    <img
      class="pokemon-artwork__image"
      :src="artworkUrl(pokemon.id, isShinyShown)"
      :alt="isShinyShown ? t('card.shinyAlt', { name: pokemon.name }) : pokemon.name"
      width="320"
      height="320"
      fetchpriority="high"
      decoding="async"
    />
    <span class="pokemon-artwork__who" aria-hidden="true">{{ t('card.whoIsIt') }}</span>
    <PokeBall class="pokemon-artwork__reveal-ball" :size="46" />
    <button
      v-if="!revealed"
      class="pokemon-artwork__skip"
      type="button"
      :aria-label="t('card.revealNow')"
      @click="emit('revealNow')"
    />
    <span
      v-for="sparkle in sparkles"
      :key="sparkle.id"
      class="pokemon-artwork__sparkle"
      aria-hidden="true"
      :style="{ left: `${sparkle.left}%`, top: `${sparkle.top}%`, animationDelay: `${sparkle.delay}s` }"
      ><Icon name="lucide:sparkle"
    /></span>
    <div class="pokemon-artwork__tools">
      <button
        class="icon-btn"
        type="button"
        :title="t('card.playCry')"
        :aria-label="t('card.playCry')"
        @click="playCry"
      >
        <Icon name="lucide:volume-2" aria-hidden="true" />
      </button>
      <button
        class="icon-btn"
        type="button"
        :aria-pressed="isShinyShown"
        :title="t('card.shinyTitle')"
        :aria-label="t('card.showShiny')"
        @click="toggleShiny"
      >
        <Icon name="lucide:sparkles" aria-hidden="true" />
      </button>
    </div>
    <span v-if="showsShinyBadge" class="pokemon-artwork__shiny-badge"
      ><Icon name="lucide:sparkles" aria-hidden="true" /> {{ t('card.shinyBadge') }}</span
    >
  </div>
</template>

<style scoped lang="scss" src="./PokemonArtwork.scss" />
