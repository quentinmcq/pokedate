<script setup lang="ts">
import type { DateFieldValue } from '#shared/types/pokemon'
import type { DateFieldKey } from '#shared/utils/date'

defineProps<{
  number: number
  placeholder: string
  errorId: string
  invalidPart: DateFieldKey | null
}>()
const name = defineModel<string>('name', { required: true })
const date = defineModel<DateFieldValue>('date', { required: true })

const { t } = useLocaleTools()
const nameInputId = useId()
const dateField = useTemplateRef('dateField')

defineExpose({ focusInvalidPart: (part: DateFieldKey) => dateField.value?.focusInvalidPart(part) })
</script>

<template>
  <label class="visually-hidden" :for="nameInputId">{{ t('challenge.playerName', { number }) }}</label>
  <input
    :id="nameInputId"
    v-model="name"
    class="text-input player-name"
    :placeholder="placeholder"
    :maxlength="PLAYER_NAME_MAX_LENGTH"
  />
  <DateField
    ref="dateField"
    v-model="date"
    compact
    :legend="t('challenge.playerDate', { number })"
    :error-id="errorId"
    :invalid-part="invalidPart"
  />
</template>

<style scoped lang="scss" src="./PlayerFields.scss" />
