<script setup lang="ts">
import type { Publication } from '~/composables/usePublishedDraws'

const props = defineProps<{ publication: Publication | null }>()
const emit = defineEmits<{ saved: [preferences: { autoPublish: boolean }] }>()

const { nickname, isAutoPublishEnabled, savePreferences } = usePublishedDraws()
const { t } = useLocaleTools()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const nicknameInput = ref('')
const autoPublishInput = ref(true)
const dialogError = ref('')
const isSaving = ref(false)

function open() {
  nicknameInput.value = nickname.value === ANONYMOUS_NICKNAME ? '' : nickname.value
  autoPublishInput.value = isAutoPublishEnabled.value
  dialogError.value = ''
  dialog.value?.showModal()
}

const close = () => dialog.value?.close()

async function save() {
  const check = checkNickname(nicknameInput.value)
  if (!check.ok) return (dialogError.value = t(check.error.key))
  isSaving.value = true
  dialogError.value = ''
  try {
    await savePreferences({ nickname: check.nickname, autoPublish: autoPublishInput.value }, props.publication)
    close()
    emit('saved', { autoPublish: autoPublishInput.value })
  } catch (error) {
    dialogError.value = t(publicationErrorKey(error, 'publication.renameFailed'))
  } finally {
    isSaving.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <dialog ref="dialog" class="publish-dialog" aria-labelledby="publish-dialog-title" @click.self="close">
    <form class="publish-dialog__content" novalidate @submit.prevent="save">
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
        <button class="btn btn--ghost btn--sm" type="button" @click="close">{{ t('common.cancel') }}</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped lang="scss" src="./PublicationSettingsDialog.scss" />
