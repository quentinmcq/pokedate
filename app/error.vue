<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
useHead({ title: `${props.error.statusCode} · PokéDate` })
</script>

<template>
  <AppHeader />
  <main>
    <section class="entry">
      <h1>{{ error.statusCode === 404 ? 'Un Pokémon sauvage a fui…' : 'Oups, une erreur' }}</h1>
      <p class="sub">{{ error.statusCode === 404 ? "Cette page n'existe pas." : error.statusMessage }}</p>
      <div class="actions">
        <button class="btn primary" type="button" @click="clearError({ redirect: '/' })">Retour à l'accueil</button>
      </div>
    </section>
  </main>
</template>
