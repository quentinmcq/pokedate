import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import DateField from '~/components/date/DateField.vue'
import type { DateFieldValue } from '#shared/types/pokemon'

async function mountField(initial: DateFieldValue = { day: '', month: '', year: '' }) {
  const model = { value: initial }
  const wrapper = await mountSuspended(DateField, {
    props: {
      modelValue: initial,
      'onUpdate:modelValue': (value: DateFieldValue) => {
        model.value = value
        wrapper.setProps({ modelValue: value })
      },
    },
    attachTo: document.body,
  })
  return { wrapper, model, inputs: wrapper.findAll('input') }
}

describe('DateField', () => {
  it('affiche trois champs Jour / Mois / Année', async () => {
    const { inputs, wrapper } = await mountField()
    expect(inputs).toHaveLength(3)
    expect(wrapper.text()).toContain('Jour')
    expect(inputs[2]!.attributes('maxlength')).toBe('4')
    expect(inputs[0]!.attributes('autocomplete')).toBe('bday-day')
  })

  it('ne garde que les chiffres', async () => {
    const { inputs, model } = await mountField()
    await inputs[0]!.setValue('1a7')
    expect(model.value.day).toBe('17')
  })

  it('passe au champ suivant quand un champ est plein', async () => {
    const { inputs } = await mountField()
    await inputs[0]!.setValue('17')
    await nextTick()
    expect(document.activeElement).toBe(inputs[1]!.element)
  })

  it('remplit les trois champs quand on colle une date', async () => {
    const { inputs, model } = await mountField()
    const paste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => '7/3/1995' } })
    inputs[0]!.element.dispatchEvent(paste)
    await nextTick()
    expect(model.value).toEqual({ day: '07', month: '03', year: '1995' })
  })

  it('accepte aussi le format ISO collé', async () => {
    const { inputs, model } = await mountField()
    const paste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => '2026-10-17' } })
    inputs[1]!.element.dispatchEvent(paste)
    await nextTick()
    expect(model.value).toEqual({ day: '17', month: '10', year: '2026' })
  })

  it('signale une erreur aux lecteurs d’écran', async () => {
    const wrapper = await mountSuspended(DateField, {
      props: { modelValue: { day: '', month: '', year: '' }, invalid: true, errorId: 'date-error' },
    })
    for (const input of wrapper.findAll('input')) {
      expect(input.attributes('aria-invalid')).toBe('true')
      expect(input.attributes('aria-describedby')).toBe('date-error')
    }
  })
})
