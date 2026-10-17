<script setup lang="ts">
import type { PublicDraw } from '#shared/types/pokemon'

const props = defineProps<{ pokemonId: number; pokemonName: string; shiny: boolean }>()

const NICKNAME_STORAGE_KEY = 'pokedate.nickname'

const nickname = ref('')
const status = ref<'idle' | 'sending' | 'published'>('idle')
const errorMessage = ref('')

onMounted(() => {
  try {
    nickname.value = localStorage.getItem(NICKNAME_STORAGE_KEY) ?? ''
  } catch {}
})

const rememberNickname = (value: string) => {
  try {
    localStorage.setItem(NICKNAME_STORAGE_KEY, value)
  } catch {}
}

const readErrorMessage = (error: unknown) =>
  (error as { data?: { message?: string } })?.data?.message ?? 'La publication a échoué, réessaie plus tard.'

async function publish() {
  const check = checkNickname(nickname.value)
  if (!check.ok) return (errorMessage.value = check.error)
  errorMessage.value = ''
  status.value = 'sending'
  try {
    await $fetch<PublicDraw>('/api/draws', {
      method: 'POST',
      body: { pokemonId: props.pokemonId, shiny: props.shiny, nickname: check.nickname },
    })
    rememberNickname(check.nickname)
    status.value = 'published'
  } catch (error) {
    errorMessage.value = readErrorMessage(error)
    status.value = 'idle'
  }
}
</script>

<template>
  <section class="publish" aria-labelledby="publish-title">
    <h2 id="publish-title" class="publish__title">
      <Icon name="lucide:radio-tower" aria-hidden="true" /> Publier dans les derniers tirages
    </h2>
    <p v-if="status === 'published'" class="publish__done" role="status">
      C'est publié&nbsp;! <NuxtLink to="/tirages" class="text-link">Voir les derniers tirages</NuxtLink>
    </p>
    <form v-else class="publish__form" novalidate @submit.prevent="publish">
      <label class="visually-hidden" for="publish-nickname">Ton pseudo</label>
      <input
        id="publish-nickname"
        v-model="nickname"
        class="text-input publish__nickname"
        placeholder="Ton pseudo"
        autocomplete="nickname"
        :maxlength="NICKNAME_LENGTH.max"
        :aria-invalid="!!errorMessage || undefined"
        aria-describedby="publish-error publish-note"
      />
      <button class="btn btn--ghost btn--sm" type="submit" :disabled="status === 'sending'">
        <Icon name="lucide:send" aria-hidden="true" /> Publier {{ pokemonName }}
      </button>
    </form>
    <p id="publish-error" class="field-error" role="alert">{{ errorMessage }}</p>
    <p id="publish-note" class="publish__note">
      Ton pseudo, ce Pokémon et l'heure seront visibles par tous pendant 7 jours au plus. Ta date n'est jamais envoyée.
    </p>
  </section>
</template>

<style scoped lang="scss" src="./PublishDraw.scss" />
