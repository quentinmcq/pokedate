<script setup lang="ts">
import type { PokemonDetail } from '#shared/types/pokemon'
import type { TournamentMatch, TournamentStanding } from '#shared/utils/tournament'

export interface TournamentContender {
  label: string
  shiny: boolean
  pokemon: PokemonDetail
}

const props = defineProps<{
  contenders: readonly TournamentContender[]
  standings: readonly TournamentStanding[]
  matches: readonly TournamentMatch[]
}>()

const { t } = useLocaleTools()

const ranking = computed(() =>
  props.standings.map((standing) => ({ ...standing, contender: props.contenders[standing.player]! })),
)

const contenderName = (index: number) => `${props.contenders[index]!.label} (${props.contenders[index]!.pokemon.name})`

const describeMatch = ({ first, second, winner }: TournamentMatch) => {
  if (winner === null) return t('tournament.matchDraw', { first: contenderName(first), second: contenderName(second) })
  return t('tournament.matchWin', {
    winner: contenderName(winner),
    loser: contenderName(winner === first ? second : first),
  })
}
</script>

<template>
  <ol class="ranking">
    <li
      v-for="(entry, position) in ranking"
      :key="entry.player"
      class="ranking__row"
      :class="{ 'ranking__row--champion': position === 0 }"
      :style="{ '--accent': typeColor(entry.contender.pokemon.types[0]) }"
    >
      <span class="ranking__position" aria-hidden="true">{{ position + 1 }}</span>
      <img
        class="ranking__sprite"
        :src="spriteUrl(entry.contender.pokemon.id, entry.contender.shiny)"
        alt=""
        width="56"
        height="56"
      />
      <span class="ranking__who">
        <span class="ranking__player"
          ><span class="visually-hidden">{{ t('tournament.rank', { rank: position + 1 }) }}</span
          >{{ entry.contender.label }}</span
        >
        <NuxtLinkLocale class="ranking__pokemon" :to="pokemonPath(entry.contender.pokemon)">{{
          entry.contender.pokemon.name
        }}</NuxtLinkLocale>
      </span>
      <span class="ranking__record">{{
        t('tournament.record', { wins: entry.wins, draws: entry.draws, losses: entry.losses })
      }}</span>
      <span class="ranking__points">{{ t('tournament.points', { points: entry.points }) }}</span>
    </li>
  </ol>
  <p class="ranking-hint">{{ t('tournament.scoring') }}</p>
  <AccordionItem :question="t('tournament.showMatches', { count: matches.length })" group="tournament-matches">
    <ul class="matches">
      <li v-for="match in matches" :key="`${match.first}-${match.second}`">
        {{ describeMatch(match) }}
      </li>
    </ul>
  </AccordionItem>
</template>

<style scoped lang="scss" src="./TournamentStandings.scss" />
