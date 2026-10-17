<script setup lang="ts">
import type { DateFieldValue } from '#shared/types/pokemon'

const props = defineProps<{
  compact?: boolean
  legend?: string
  errorId?: string
  invalid?: boolean
  fieldNames?: Record<keyof DateFieldValue, string>
}>()
const date = defineModel<DateFieldValue>({ required: true })

const DATE_PARTS = [
  { key: 'day', label: 'Jour', placeholder: 'JJ', maxLength: 2, autocomplete: 'bday-day' },
  { key: 'month', label: 'Mois', placeholder: 'MM', maxLength: 2, autocomplete: 'bday-month' },
  { key: 'year', label: 'Année', placeholder: 'AAAA', maxLength: 4, autocomplete: 'bday-year' },
] as const

type DatePart = (typeof DATE_PARTS)[number]

const SEPARATOR_KEYS = ['/', '.', '-', ' ']

const inputs = useTemplateRef<HTMLInputElement[]>('inputs')
const focusPart = (index: number) => inputs.value?.[index]?.focus()

function onInput(part: DatePart, index: number, event: Event) {
  const input = event.target as HTMLInputElement
  input.value = input.value.replace(/\D/g, '').slice(0, part.maxLength)
  date.value = { ...date.value, [part.key]: input.value }
  if (input.value.length >= part.maxLength) focusPart(index + 1)
}

function onKeydown(index: number, event: KeyboardEvent) {
  const input = event.target as HTMLInputElement
  if (event.key === 'Backspace' && !input.value) focusPart(index - 1)
  if (SEPARATOR_KEYS.includes(event.key) && index < DATE_PARTS.length - 1) {
    event.preventDefault()
    focusPart(index + 1)
  }
}

function onPaste(event: ClipboardEvent) {
  const pastedDate = parsePastedDate(event.clipboardData?.getData('text') ?? '')
  if (!pastedDate) return
  event.preventDefault()
  date.value = pastedDate
  focusPart(DATE_PARTS.length - 1)
}

const selectContent = (event: FocusEvent) => (event.target as HTMLInputElement).select()

const readInput = (index: number) => inputs.value?.[index]?.value ?? ''

function syncInputsWith(value: DateFieldValue) {
  DATE_PARTS.forEach((part, index) => {
    const input = inputs.value?.[index]
    if (input && input.value !== value[part.key]) input.value = value[part.key]
  })
}

watch(date, syncInputsWith)

onMounted(() => {
  const typedBeforeHydration: DateFieldValue = { day: readInput(0), month: readInput(1), year: readInput(2) }
  const hasTypedValue = DATE_PARTS.some((part) => typedBeforeHydration[part.key] !== date.value[part.key])
  if (hasTypedValue && Object.values(typedBeforeHydration).some(Boolean)) date.value = typedBeforeHydration
  else syncInputsWith(date.value)
})
</script>

<template>
  <fieldset class="date-field" :class="{ 'date-field--compact': props.compact }">
    <legend class="visually-hidden">{{ props.legend ?? 'Date' }}</legend>
    <template v-for="(part, index) in DATE_PARTS" :key="part.key">
      <span v-if="index > 0" class="date-field__sep" aria-hidden="true">/</span>
      <label class="date-field__part" :class="{ 'date-field__part--year': part.key === 'year' }">
        <span :class="{ 'visually-hidden': props.compact }">{{ part.label }}</span>
        <input
          ref="inputs"
          class="date-field__input"
          inputmode="numeric"
          :name="props.fieldNames?.[part.key]"
          :autocomplete="part.autocomplete"
          :maxlength="part.maxLength"
          :placeholder="part.placeholder"
          :value.attr="date[part.key]"
          :aria-invalid="props.invalid || undefined"
          :aria-describedby="props.errorId"
          required
          @input="onInput(part, index, $event)"
          @keydown="onKeydown(index, $event)"
          @paste="onPaste"
          @focus="selectContent"
        />
      </label>
    </template>
  </fieldset>
</template>

<style scoped lang="scss">
@use '../assets/scss/abstracts/functions' as *;
@use '../assets/scss/abstracts/mixins' as *;

.date-field {
  display: inline-flex;
  align-items: flex-end;
  gap: space(2);
  border: 0;
  margin: 0;
  padding: 0;

  &__part {
    display: flex;
    flex-direction: column;
    gap: space(2);
    @include eyebrow;
  }

  &__input {
    width: 78px;
    height: 74px;
    text-align: center;
    font-family: var(--font-mono), monospace;
    font-size: font-size('2xl');
    font-weight: weight('bold');
    background: color('surface-1');
    border: 2px solid color('line');
    border-radius: radius('lg');
    outline: none;
    transition:
      border-color duration('base'),
      transform duration('base');

    &::placeholder {
      color: color('placeholder');
    }
    &:focus-visible,
    &:focus {
      border-color: color('highlight');
      transform: translateY(-2px);
    }
    &[aria-invalid='true'] {
      border-color: color('error');
    }
  }

  &__part--year &__input {
    width: 132px;
  }

  &__sep {
    font-family: var(--font-mono), monospace;
    font-size: font-size('2xl');
    color: color('placeholder');
    padding-bottom: 14px;
  }

  &--compact {
    .date-field__input {
      width: 56px;
      height: 56px;
      font-size: 1.35rem;
      border-radius: radius('md');
    }
    .date-field__part--year .date-field__input {
      width: 92px;
    }
    .date-field__sep {
      font-size: 1.3rem;
      padding-bottom: 12px;
    }
  }

  @include bp(phone) {
    gap: space(1);

    &__input {
      width: 62px;
      height: 64px;
      font-size: 1.6rem;
    }
    &__part--year &__input {
      width: 104px;
    }
    &__sep {
      font-size: font-size('xl');
    }
  }
}
</style>
