<script setup lang="ts">
import type { DateInput } from '#shared/types/pokemon'

const props = defineProps<{
  compact?: boolean
  legend?: string
  errorId?: string
  invalid?: boolean
}>()
const model = defineModel<DateInput>({ required: true })

const parts = [
  { key: 'd', label: 'Jour', placeholder: 'JJ', max: 2, autocomplete: 'bday-day' },
  { key: 'm', label: 'Mois', placeholder: 'MM', max: 2, autocomplete: 'bday-month' },
  { key: 'y', label: 'Année', placeholder: 'AAAA', max: 4, autocomplete: 'bday-year' },
] as const

const inputs = useTemplateRef<HTMLInputElement[]>('inputs')

function onInput(i: number, e: Event) {
  const el = e.target as HTMLInputElement
  const part = parts[i]!
  el.value = el.value.replace(/\D/g, '').slice(0, part.max)
  model.value = { ...model.value, [part.key]: el.value }
  if (el.value.length >= part.max) inputs.value?.[i + 1]?.focus()
}

function onKeydown(i: number, e: KeyboardEvent) {
  const el = e.target as HTMLInputElement
  if (e.key === 'Backspace' && !el.value) inputs.value?.[i - 1]?.focus()
  if (['/', '.', '-', ' '].includes(e.key) && inputs.value?.[i + 1]) {
    e.preventDefault()
    inputs.value[i + 1]!.focus()
  }
}

function onPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text') ?? ''
  const fr = /^\s*(\d{1,2})\D(\d{1,2})\D(\d{4})\s*$/.exec(text)
  const iso = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})\s*$/.exec(text)
  const m = fr ? { d: fr[1]!, m: fr[2]!, y: fr[3]! } : iso ? { d: iso[3]!, m: iso[2]!, y: iso[1]! } : null
  if (!m) return
  e.preventDefault()
  model.value = { d: m.d.padStart(2, '0'), m: m.m.padStart(2, '0'), y: m.y }
  inputs.value?.[2]?.focus()
}
</script>

<template>
  <fieldset class="date-field" :class="{ 'date-field--compact': props.compact }">
    <legend class="visually-hidden">{{ props.legend ?? 'Date' }}</legend>
    <template v-for="(part, i) in parts" :key="part.key">
      <span v-if="i" class="date-field__sep" aria-hidden="true">/</span>
      <label class="date-field__part" :class="{ 'date-field__part--year': part.key === 'y' }">
        <span :class="{ 'visually-hidden': props.compact }">{{ part.label }}</span>
        <input
          ref="inputs"
          class="date-field__input"
          inputmode="numeric"
          :autocomplete="part.autocomplete"
          :maxlength="part.max"
          :placeholder="part.placeholder"
          :value="model[part.key]"
          :aria-invalid="props.invalid || undefined"
          :aria-describedby="props.errorId"
          required
          @input="onInput(i, $event)"
          @keydown="onKeydown(i, $event)"
          @paste="onPaste"
          @focus="($event.target as HTMLInputElement).select()"
        />
      </label>
    </template>
  </fieldset>
</template>
