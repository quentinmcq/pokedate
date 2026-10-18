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
const { t } = useLocaleTools()

const status = ref<Status>('waiting')
const publication = ref<Publication | null>(null)
const isBusy = ref(false)
const actionError = ref('')

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const nicknameInput = ref('')
const autoPublishInput = ref(true)
const dialogError = ref('')
const shownNickname = computed(() => (nickname.value === ANONYMOUS_NICKNAME ? t('common.anonymous') : nickname.value))
const isSaving = ref(false)

const STATUS_ICONS: Record<Status, string> = {
  waiting: 'lucide:users-round',
  publishing: 'lucide:users-round',
  published: 'lucide:users-round',
  removed: 'lucide:eye-off',
  failed: 'lucide:cloud-off',
  limit: 'lucide:eye-off',
  disabled: 'lucide:eye-off',
}

const NICKNAME_PROMPT_STORAGE_KEY = 'pokedate.nickname-prompt-seen'
const NICKNAME_PROMPT_DURATION_MS = 9000

// On phones the line under the card sits behind the bottom bar: the first publication says it once at the top.
const isNicknamePromptShown = ref(false)
let nicknamePromptTimer: ReturnType<typeof setTimeout> | undefined

function hasSeenNicknamePrompt() {
  try {
    return localStorage.getItem(NICKNAME_PROMPT_STORAGE_KEY) === '1'
  } catch {
    return true
  }
}

function showNicknamePrompt() {
  if (nickname.value !== ANONYMOUS_NICKNAME || hasSeenNicknamePrompt()) return
  try {
    localStorage.setItem(NICKNAME_PROMPT_STORAGE_KEY, '1')
  } catch {}
  isNicknamePromptShown.value = true
  nicknamePromptTimer = setTimeout(hideNicknamePrompt, NICKNAME_PROMPT_DURATION_MS)
}

function hideNicknamePrompt() {
  clearTimeout(nicknamePromptTimer)
  isNicknamePromptShown.value = false
}

onBeforeUnmount(hideNicknamePrompt)

const publishedPokemon = () => ({
  pokemonId: props.pokemonId,
  shiny: props.shiny,
  bonusPokemonId: props.bonusPokemonId,
})

const readErrorMessage = (error: unknown, fallbackKey: string) =>
  t((error as { statusCode?: number })?.statusCode === 429 ? 'publication.tooFast' : fallbackKey)

async function publishNow() {
  status.value = 'publishing'
  actionError.value = ''
  try {
    publication.value = await publish(publishedPokemon())
    trackEvent('publish')
    status.value = 'published'
    showNicknamePrompt()
  } catch {
    status.value = 'failed'
  }
}

function startPublication() {
  if (status.value !== 'waiting' || !props.ready || isAutomatedBrowser()) return
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
    actionError.value = readErrorMessage(error, 'publication.removeFailed')
  } finally {
    isBusy.value = false
  }
}

async function republish() {
  isBusy.value = true
  await publishNow()
  isBusy.value = false
}

function openSettingsFromPrompt() {
  hideNicknamePrompt()
  openSettings()
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
  if (!check.ok) return (dialogError.value = t(check.error.key))
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
    dialogError.value = readErrorMessage(error, 'publication.renameFailed')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div v-if="status !== 'waiting'" class="draw-publication" role="status">
    <Icon :name="STATUS_ICONS[status]" class="draw-publication__icon" aria-hidden="true" />
    <p class="draw-publication__text">
      <template v-if="status === 'publishing'">{{ t('publication.publishing') }}</template>
      <i18n-t v-else-if="status === 'published'" keypath="publication.published" scope="global">
        <template #draws
          ><NuxtLinkLocale to="/tirages" class="text-link">{{ t('publication.drawsLink') }}</NuxtLinkLocale></template
        >
        <template #nickname
          ><b>{{ shownNickname }}</b></template
        >
      </i18n-t>
      <template v-else-if="status === 'removed'">{{ t('publication.removed') }}</template>
      <template v-else-if="status === 'failed'">{{ t('publication.failed') }}</template>
      <template v-else-if="status === 'limit'">{{
        t('publication.limit', { limit: DAILY_AUTO_PUBLISH_LIMIT })
      }}</template>
      <template v-else>{{ t('publication.disabled') }}</template>
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
        {{ status === 'published' ? t('publication.changeNickname') : t('publication.settings') }}
      </button>
      <button
        v-if="status === 'published'"
        class="link-button"
        type="button"
        :disabled="isBusy"
        @click="removePublication"
      >
        {{ t('publication.remove') }}
      </button>
      <button
        v-if="status === 'removed' || status === 'failed'"
        class="link-button"
        type="button"
        :disabled="isBusy"
        @click="republish"
      >
        {{ status === 'removed' ? t('publication.restore') : t('common.retry') }}
      </button>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="nickname-prompt">
      <aside v-if="isNicknamePromptShown" class="nickname-prompt" :aria-label="t('publication.promptLabel')">
        <Icon name="lucide:users-round" class="nickname-prompt__icon" aria-hidden="true" />
        <p class="nickname-prompt__text">{{ t('publication.promptText') }}</p>
        <button class="btn btn--primary btn--sm" type="button" aria-haspopup="dialog" @click="openSettingsFromPrompt">
          {{ t('publication.promptAction') }}
        </button>
        <button
          class="icon-btn nickname-prompt__close"
          type="button"
          :aria-label="t('common.close')"
          @click="hideNicknamePrompt"
        >
          <Icon name="lucide:x" aria-hidden="true" />
        </button>
      </aside>
    </Transition>
  </Teleport>

  <dialog ref="dialog" class="publish-dialog" aria-labelledby="publish-dialog-title" @click.self="closeSettings">
    <form class="publish-dialog__content" novalidate @submit.prevent="saveSettings">
      <h2 id="publish-dialog-title" class="publish-dialog__title">{{ t('publication.dialogTitle') }}</h2>
      <p class="publish-dialog__public">
        <Icon name="lucide:globe" aria-hidden="true" />
        <i18n-t keypath="publication.notice" scope="global">
          <template #page
            ><NuxtLinkLocale to="/tirages" class="text-link" target="_blank">{{
              t('publication.noticePage')
            }}</NuxtLinkLocale></template
          >
          <template #limit>{{ DAILY_AUTO_PUBLISH_LIMIT }}</template>
        </i18n-t>
      </p>
      <label class="publish-dialog__label" for="publish-nickname">{{ t('publication.nicknameLabel') }}</label>
      <input
        id="publish-nickname"
        v-model="nicknameInput"
        class="publish-dialog__input"
        :placeholder="t('common.anonymous')"
        autocomplete="nickname"
        :maxlength="NICKNAME_LENGTH.max"
        :aria-invalid="!!dialogError || undefined"
        aria-describedby="publish-error publish-note"
      />
      <p id="publish-error" class="field-error" role="alert">{{ dialogError }}</p>
      <p id="publish-note" class="publish-dialog__note">{{ t('publication.nicknameNote') }}</p>
      <label class="toggle publish-dialog__toggle">
        <input v-model="autoPublishInput" type="checkbox" />
        {{ t('publication.autoPublish') }}
      </label>
      <div class="publish-dialog__actions">
        <button class="btn btn--primary btn--sm" type="submit" :disabled="isSaving">{{ t('publication.save') }}</button>
        <button class="btn btn--ghost btn--sm" type="button" @click="closeSettings">{{ t('common.cancel') }}</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped lang="scss" src="./DrawPublication.scss" />
