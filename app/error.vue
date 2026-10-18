<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)
const { t } = useLocaleTools()
const localePath = useLocalePath()

useHead({ title: () => `${notFound.value ? t('error.notFoundTitle') : t('error.title')} · PokéDate` })
useSeoMeta({ robots: 'noindex' })
</script>

<template>
  <NuxtLayout>
    <section class="hero">
      <h1>{{ notFound ? t('error.notFoundHeading') : t('error.heading') }}</h1>
      <p class="lead">{{ notFound ? t('error.notFoundText') : t('error.text') }}</p>
      <div class="actions">
        <button class="btn btn--primary" type="button" @click="clearError({ redirect: localePath('/') })">
          {{ t('error.home') }}
        </button>
        <NuxtLinkLocale v-if="notFound" class="btn btn--ghost" to="/pokemon">{{
          t('error.allPokemon')
        }}</NuxtLinkLocale>
      </div>
    </section>
  </NuxtLayout>
</template>
