<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)

useHead({ title: () => `${notFound.value ? 'Page introuvable' : 'Erreur'} · PokéDate` })
useSeoMeta({ robots: 'noindex' })
</script>

<template>
  <NuxtLayout>
    <section class="hero">
      <h1>{{ notFound ? 'Un Pokémon sauvage a fui…' : 'Oups, une erreur' }}</h1>
      <p class="lead">
        {{
          notFound ? "Cette page n'existe pas, ou plus." : "Quelque chose s'est mal passé. Réessaie dans un instant."
        }}
      </p>
      <div class="actions">
        <button class="btn btn--primary" type="button" @click="clearError({ redirect: '/' })">
          Retour à l'accueil
        </button>
        <NuxtLink v-if="notFound" class="btn btn--ghost" to="/pokemon">Voir les 1025 Pokémon</NuxtLink>
      </div>
    </section>
  </NuxtLayout>
</template>
