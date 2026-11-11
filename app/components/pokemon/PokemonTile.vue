<script setup lang="ts">
import type { PokemonSummary } from '#shared/types/pokemon'
import type { DiscoveryState } from '~/composables/usePokedex'

const props = withDefaults(
  defineProps<{ pokemon: PokemonSummary; shiny?: boolean; seenShiny?: boolean; state?: DiscoveryState }>(),
  { shiny: false, seenShiny: false, state: 'caught' },
)
const { t } = useLocaleTools()
const link = computed(() => ({ path: pokemonPath(props.pokemon), query: props.shiny ? { shiny: '1' } : {} }))
</script>

<template>
  <div v-if="state === 'unknown'" class="dex-cell dex-cell--unknown">
    <span class="dex-cell__unknown" aria-hidden="true">?</span>
    <span><span class="visually-hidden">{{ t('tile.unknown') }}</span>#{{ padNumber(pokemon.id, 4) }}</span>
  </div>
  <NuxtLinkLocale
    v-else
    class="dex-cell"
    :class="{ 'dex-cell--shiny': shiny, 'dex-cell--seen': state === 'seen' }"
    :to="link"
  >
    <img loading="lazy" decoding="async" :src="spriteUrl(pokemon.id, shiny)" alt="" width="72" height="72" />
    <span v-if="state === 'seen' && seenShiny" class="dex-cell__seen-shiny" :title="t('tile.seenShiny')"
      ><Icon name="lucide:sparkles" aria-hidden="true" /><span class="visually-hidden">{{
        t('tile.seenShiny')
      }}</span></span
    >
    <b>{{ pokemon.name }}</b>
    <span
      ><template v-if="state === 'seen'"
        >{{ t('tile.seen') }}<span class="visually-hidden">{{ t('tile.notCaught') }}</span> · </template
      >#{{ padNumber(pokemon.id, 4) }}</span
    >
  </NuxtLinkLocale>
</template>

<style scoped lang="scss" src="./PokemonTile.scss" />
