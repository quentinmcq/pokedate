<script setup lang="ts">
import type { DateInput } from '#shared/types/pokemon'

const props = defineProps<{ compact?: boolean }>()
const model = defineModel<DateInput>({ required: true })

const parts = [
  { key: 'd', label: 'Jour', placeholder: 'JJ', max: 2 },
  { key: 'm', label: 'Mois', placeholder: 'MM', max: 2 },
  { key: 'y', label: 'Année', placeholder: 'AAAA', max: 4 },
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
  if (['/', '.', '-'].includes(e.key) && inputs.value?.[i + 1]) {
    e.preventDefault()
    inputs.value[i + 1]!.focus()
  }
}
</script>

<template>
  <div class="date-field" :class="{ compact: props.compact }">
    <template v-for="(part, i) in parts" :key="part.key">
      <span v-if="i" class="sep">/</span>
      <label :class="{ y: part.key === 'y' }">
        <span v-if="!props.compact">{{ part.label }}</span>
        <input
          ref="inputs"
          inputmode="numeric"
          :maxlength="part.max"
          :placeholder="part.placeholder"
          :aria-label="part.label"
          :value="model[part.key]"
          required
          @input="onInput(i, $event)"
          @keydown="onKeydown(i, $event)"
          @focus="($event.target as HTMLInputElement).select()"
        />
      </label>
    </template>
  </div>
</template>
