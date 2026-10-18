<script setup lang="ts">
import type { PokemonSummary, PublicDraw } from '#shared/types/pokemon'

const props = withDefaults(
  defineProps<{
    pokemonId: number
    pokemonName: string
    shiny: boolean
    bonusPokemon?: PokemonSummary | null
    nudge?: boolean
  }>(),
  { bonusPokemon: null, nudge: false },
)

const NICKNAME_STORAGE_KEY = 'pokedate.nickname'

const trackEvent = useTrackEvent()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const nickname = ref('')
const status = ref<'idle' | 'sending' | 'published'>('idle')
const errorMessage = ref('')

const previewName = computed(() => cleanNickname(nickname.value) || ANONYMOUS_NICKNAME)
const drawSummary = computed(() =>
  props.bonusPokemon ? `${props.pokemonName}, avec ${props.bonusPokemon.name} en bonus` : props.pokemonName,
)

function readStoredNickname() {
  try {
    return localStorage.getItem(NICKNAME_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function rememberNickname(value: string) {
  if (value === ANONYMOUS_NICKNAME) return
  try {
    localStorage.setItem(NICKNAME_STORAGE_KEY, value)
  } catch {}
}

function openDialog() {
  if (!nickname.value) nickname.value = readStoredNickname()
  errorMessage.value = ''
  dialog.value?.showModal()
}

const closeDialog = () => dialog.value?.close()

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
      body: {
        pokemonId: props.pokemonId,
        shiny: props.shiny,
        bonusPokemonId: props.bonusPokemon?.id ?? null,
        nickname: check.nickname,
      },
    })
    rememberNickname(check.nickname)
    trackEvent('publish')
    status.value = 'published'
  } catch (error) {
    errorMessage.value = readErrorMessage(error)
    status.value = 'idle'
  }
}
</script>

<template>
  <button
    class="btn btn--ghost btn--sm publish-button"
    :class="{ 'publish-button--nudge': nudge && status === 'idle' }"
    type="button"
    :disabled="status === 'published'"
    aria-haspopup="dialog"
    @click="openDialog"
  >
    <Icon :name="status === 'published' ? 'lucide:check' : 'lucide:radio-tower'" aria-hidden="true" />
    {{ status === 'published' ? 'Ajouté aux tirages' : 'Ajouter aux tirages' }}
  </button>
  <p v-if="nudge && status === 'idle'" class="publish-hint">Montre-le aux autres joueurs dans les tirages.</p>

  <dialog ref="dialog" class="publish-dialog" aria-labelledby="publish-dialog-title" @click.self="closeDialog">
    <div class="publish-dialog__content">
      <h2 id="publish-dialog-title" class="publish-dialog__title">
        {{ status === 'published' ? "C'est publié !" : 'Ajouter aux derniers tirages' }}
      </h2>

      <template v-if="status === 'published'">
        <p class="publish-dialog__preview">
          <b>{{ previewName }}</b> a tiré {{ drawSummary }}.
        </p>
        <div class="publish-dialog__actions">
          <NuxtLink to="/tirages" class="btn btn--primary btn--sm" @click="closeDialog"
            >Voir les derniers tirages</NuxtLink
          >
          <button class="btn btn--ghost btn--sm" type="button" @click="closeDialog">Fermer</button>
        </div>
      </template>

      <form v-else novalidate @submit.prevent="publish">
        <p class="publish-dialog__public">
          <Icon name="lucide:globe" aria-hidden="true" /> Visible par tout le monde sur la page
          <NuxtLink to="/tirages" class="text-link" target="_blank">Derniers tirages</NuxtLink>, pendant 7 jours au
          plus.
        </p>
        <p class="publish-dialog__preview">
          <b>{{ previewName }}</b> a tiré {{ drawSummary }}.
        </p>
        <label class="publish-dialog__label" for="publish-nickname">Ton pseudo (facultatif)</label>
        <input
          id="publish-nickname"
          v-model="nickname"
          class="publish-dialog__input"
          :placeholder="ANONYMOUS_NICKNAME"
          autocomplete="nickname"
          :maxlength="NICKNAME_LENGTH.max"
          :aria-invalid="!!errorMessage || undefined"
          aria-describedby="publish-error publish-note"
        />
        <p id="publish-error" class="field-error" role="alert">{{ errorMessage }}</p>
        <p id="publish-note" class="publish-dialog__note">
          Laisse vide pour rester anonyme. Seuls le pseudo, le Pokémon et l'heure sont publiés, jamais ta date.
        </p>
        <div class="publish-dialog__actions">
          <button class="btn btn--primary btn--sm" type="submit" :disabled="status === 'sending'">
            <Icon name="lucide:send" aria-hidden="true" /> Publier
          </button>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeDialog">Annuler</button>
        </div>
      </form>
    </div>
  </dialog>
</template>

<style scoped lang="scss" src="./PublishDrawButton.scss" />
