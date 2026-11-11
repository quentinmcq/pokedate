<script setup lang="ts">
import type { Publication } from '~/composables/usePublishedDraws'

const props = defineProps<{
  ready: boolean
  pokemonId: number
  shiny: boolean
  bonusPokemonId: number | null
}>()

type Status = 'waiting' | 'publishing' | 'published' | 'removed' | 'failed' | 'limit' | 'disabled'

const { nickname, isAutoPublishEnabled, load, todaysPublicationOf, hasReachedDailyLimit, publish, remove } =
  usePublishedDraws()
const trackEvent = useTrackEvent()
const { t } = useLocaleTools()

const status = ref<Status>('waiting')
const publication = ref<Publication | null>(null)
const isBusy = ref(false)
const actionError = ref('')
const shownNickname = computed(() => (nickname.value === ANONYMOUS_NICKNAME ? t('common.anonymous') : nickname.value))
const nicknamePrompt = useTemplateRef('nicknamePrompt')
const settingsDialog = useTemplateRef('settingsDialog')

const STATUS_ICONS: Record<Status, string> = {
  waiting: 'lucide:users-round',
  publishing: 'lucide:users-round',
  published: 'lucide:users-round',
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

async function publishNow() {
  status.value = 'publishing'
  actionError.value = ''
  try {
    publication.value = await publish(publishedPokemon())
    trackEvent('publish')
    status.value = 'published'
    nicknamePrompt.value?.show()
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
    actionError.value = t(publicationErrorKey(error, 'publication.removeFailed'))
  } finally {
    isBusy.value = false
  }
}

async function republish() {
  isBusy.value = true
  await publishNow()
  isBusy.value = false
}

const openSettings = () => settingsDialog.value?.open()

function onSettingsSaved({ autoPublish }: { autoPublish: boolean }) {
  // Whoever saved these settings chose their name on purpose, even when it stays anonymous.
  nicknamePrompt.value?.markSeen()
  if (status.value === 'disabled' && autoPublish) {
    status.value = 'waiting'
    startPublication()
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
        <template #nickname><b>{{ shownNickname }}</b></template>
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

  <NicknamePrompt ref="nicknamePrompt" @choose="openSettings" />
  <PublicationSettingsDialog ref="settingsDialog" :publication="publication" @saved="onSettingsSaved" />
</template>

<style scoped lang="scss" src="./DrawPublication.scss" />
