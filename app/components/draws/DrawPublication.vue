<script setup lang="ts">
import type { Publication } from '~/composables/usePublishedDraws'

const props = defineProps<{
  ready: boolean
  pokemonId: number
  shiny: boolean
  bonusPokemonId: number | null
}>()

type Status = 'waiting' | 'publishing' | 'published' | 'removed' | 'failed' | 'limit' | 'disabled'

const {
  nickname,
  isAutoPublishEnabled,
  load,
  todaysPublicationOf,
  hasReachedDailyLimit,
  publish,
  remove,
  savePreferences,
} = usePublishedDraws()
const trackEvent = useTrackEvent()

const status = ref<Status>('waiting')
const publication = ref<Publication | null>(null)
const isBusy = ref(false)
const actionError = ref('')

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const nicknameInput = ref('')
const autoPublishInput = ref(true)
const dialogError = ref('')
const isSaving = ref(false)

const STATUS_ICONS: Record<Status, string> = {
  waiting: 'lucide:radio-tower',
  publishing: 'lucide:radio-tower',
  published: 'lucide:radio-tower',
  removed: 'lucide:eye-off',
  failed: 'lucide:cloud-off',
  limit: 'lucide:eye-off',
  disabled: 'lucide:eye-off',
}

const publishedPokemon = () => ({
  pokemonId: props.pokemonId,
  shiny: props.shiny,
  bonusPokemonId: props.bonusPokemonId,
})

const readErrorMessage = (error: unknown, fallback: string) =>
  (error as { data?: { message?: string } })?.data?.message ?? fallback

async function publishNow() {
  status.value = 'publishing'
  actionError.value = ''
  try {
    publication.value = await publish(publishedPokemon())
    trackEvent('publish')
    status.value = 'published'
  } catch {
    status.value = 'failed'
  }
}

function startPublication() {
  if (status.value !== 'waiting' || !props.ready) return
  if (!isAutoPublishEnabled.value) status.value = 'disabled'
  else if (hasReachedDailyLimit()) status.value = 'limit'
  else publishNow()
}

onMounted(() => {
  load()
  publication.value = todaysPublicationOf(publishedPokemon())
  if (publication.value) status.value = publication.value.removed ? 'removed' : 'published'
  watch(() => props.ready, startPublication, { immediate: true })
})

async function removePublication() {
  if (!publication.value) return
  isBusy.value = true
  actionError.value = ''
  try {
    publication.value = await remove(publication.value)
    status.value = 'removed'
  } catch (error) {
    actionError.value = readErrorMessage(error, 'Le retrait a échoué, réessaie dans un instant.')
  } finally {
    isBusy.value = false
  }
}

async function republish() {
  isBusy.value = true
  await publishNow()
  isBusy.value = false
}

function openSettings() {
  nicknameInput.value = nickname.value === ANONYMOUS_NICKNAME ? '' : nickname.value
  autoPublishInput.value = isAutoPublishEnabled.value
  dialogError.value = ''
  dialog.value?.showModal()
}

const closeSettings = () => dialog.value?.close()

async function saveSettings() {
  const check = checkNickname(nicknameInput.value)
  if (!check.ok) return (dialogError.value = check.error)
  isSaving.value = true
  dialogError.value = ''
  try {
    await savePreferences({ nickname: check.nickname, autoPublish: autoPublishInput.value }, publication.value)
    closeSettings()
    if (status.value === 'disabled' && autoPublishInput.value) {
      status.value = 'waiting'
      startPublication()
    }
  } catch (error) {
    dialogError.value = readErrorMessage(error, "Le pseudo n'a pas pu être changé, réessaie dans un instant.")
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div v-if="status !== 'waiting'" class="draw-publication" role="status">
    <Icon :name="STATUS_ICONS[status]" class="draw-publication__icon" aria-hidden="true" />
    <p class="draw-publication__text">
      <template v-if="status === 'publishing'">Ajout aux derniers tirages…</template>
      <template v-else-if="status === 'published'">
        Ajouté aux <NuxtLink to="/tirages" class="text-link">derniers tirages</NuxtLink> en tant que
        <b>{{ nickname }}</b
        >.
      </template>
      <template v-else-if="status === 'removed'">Retiré des derniers tirages.</template>
      <template v-else-if="status === 'failed'">Pas pu l'ajouter aux derniers tirages.</template>
      <template v-else-if="status === 'limit'">
        Tu as déjà ajouté {{ DAILY_AUTO_PUBLISH_LIMIT }} tirages aujourd'hui : celui-ci reste privé.
      </template>
      <template v-else>Ajout automatique aux derniers tirages désactivé.</template>
      <span v-if="actionError" class="draw-publication__error">{{ actionError }}</span>
    </p>
    <div class="draw-publication__actions">
      <button
        v-if="status === 'published' || status === 'disabled'"
        class="link-button"
        type="button"
        aria-haspopup="dialog"
        @click="openSettings"
      >
        {{ status === 'published' ? 'Changer de pseudo' : 'Réglages' }}
      </button>
      <button
        v-if="status === 'published'"
        class="link-button"
        type="button"
        :disabled="isBusy"
        @click="removePublication"
      >
        Retirer
      </button>
      <button
        v-if="status === 'removed' || status === 'failed'"
        class="link-button"
        type="button"
        :disabled="isBusy"
        @click="republish"
      >
        {{ status === 'removed' ? 'Remettre' : 'Réessayer' }}
      </button>
    </div>
  </div>

  <dialog ref="dialog" class="publish-dialog" aria-labelledby="publish-dialog-title" @click.self="closeSettings">
    <form class="publish-dialog__content" novalidate @submit.prevent="saveSettings">
      <h2 id="publish-dialog-title" class="publish-dialog__title">Tes tirages publics</h2>
      <p class="publish-dialog__public">
        <Icon name="lucide:globe" aria-hidden="true" /> Tes Pokémon révélés apparaissent sur la page
        <NuxtLink to="/tirages" class="text-link" target="_blank">Derniers tirages</NuxtLink>, visible par tout le monde
        : {{ DAILY_AUTO_PUBLISH_LIMIT }} par jour au plus, effacés au bout de 7 jours. Seuls le pseudo, le Pokémon et
        l'heure sont publiés, jamais ta date.
      </p>
      <label class="publish-dialog__label" for="publish-nickname">Ton pseudo (facultatif)</label>
      <input
        id="publish-nickname"
        v-model="nicknameInput"
        class="publish-dialog__input"
        :placeholder="ANONYMOUS_NICKNAME"
        autocomplete="nickname"
        :maxlength="NICKNAME_LENGTH.max"
        :aria-invalid="!!dialogError || undefined"
        aria-describedby="publish-error publish-note"
      />
      <p id="publish-error" class="field-error" role="alert">{{ dialogError }}</p>
      <p id="publish-note" class="publish-dialog__note">Laisse vide pour rester anonyme.</p>
      <label class="toggle publish-dialog__toggle">
        <input v-model="autoPublishInput" type="checkbox" />
        Ajouter automatiquement mes prochains tirages
      </label>
      <div class="publish-dialog__actions">
        <button class="btn btn--primary btn--sm" type="submit" :disabled="isSaving">Enregistrer</button>
        <button class="btn btn--ghost btn--sm" type="button" @click="closeSettings">Annuler</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped lang="scss" src="./DrawPublication.scss" />
