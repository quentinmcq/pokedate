<script setup lang="ts">
const route = useRoute()

const CHALLENGES = [
  { label: '1 contre 1', to: '/duel', icon: 'lucide:swords' },
  { label: 'Tournoi', to: '/tournoi', icon: 'lucide:trophy' },
] as const

const activeIndex = computed(() => CHALLENGES.findIndex((challenge) => challenge.to === route.path))
</script>

<template>
  <nav class="challenge-switch" aria-label="Type de défi" :style="{ '--active-index': activeIndex }">
    <span class="challenge-switch__indicator" aria-hidden="true" />
    <NuxtLink
      v-for="(challenge, index) in CHALLENGES"
      :key="challenge.to"
      :to="challenge.to"
      class="challenge-switch__option"
      :class="{ 'is-active': index === activeIndex }"
      :aria-current="index === activeIndex ? 'page' : undefined"
    >
      <Icon :name="challenge.icon" aria-hidden="true" /> {{ challenge.label }}
    </NuxtLink>
  </nav>
</template>

<style scoped lang="scss" src="./ChallengeSwitch.scss" />
