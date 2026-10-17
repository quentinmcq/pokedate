<script setup lang="ts">
const { accent } = useAccent()
const { toast } = useToast()

useHead({
  htmlAttrs: { style: computed(() => `--accent:${accent.value[0]};--accent-2:${accent.value[1]}`) },
})
</script>

<template>
  <canvas id="confetti" aria-hidden="true" />
  <AppHeader />
  <main>
    <NuxtPage />
  </main>
  <footer class="foot">
    Données &amp; images : <a href="https://pokeapi.co" target="_blank" rel="noopener">PokeAPI</a>. Pokémon © Nintendo /
    Game Freak / The Pokémon Company. Projet de fan, non officiel.
  </footer>
  <div class="toast" :class="{ show: toast.visible }" role="status">{{ toast.msg }}</div>
</template>
