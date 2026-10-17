<script setup lang="ts">
const route = useRoute()

const CHALLENGES = [
  { label: '1 contre 1', to: '/duel', icon: 'lucide:swords' },
  { label: 'Tournoi', to: '/tournoi', icon: 'lucide:trophy' },
] as const
</script>

<template>
  <nav class="challenge-switch" aria-label="Type de défi">
    <NuxtLink
      v-for="challenge in CHALLENGES"
      :key="challenge.to"
      :to="challenge.to"
      class="challenge-switch__option"
      :class="{ 'is-active': route.path === challenge.to }"
      :aria-current="route.path === challenge.to ? 'page' : undefined"
    >
      <Icon :name="challenge.icon" aria-hidden="true" /> {{ challenge.label }}
    </NuxtLink>
  </nav>
</template>

<style scoped lang="scss" src="./ChallengeSwitch.scss" />
