import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TypeChip from '~/components/pokemon/TypeChip.vue'
import DateFormula from '~/components/date/DateFormula.vue'
import AppFooter from '~/components/layout/AppFooter.vue'

describe('TypeChip', () => {
  it('affiche le nom français et les couleurs du type', async () => {
    const wrapper = await mountSuspended(TypeChip, { props: { type: 'electric' } })
    expect(wrapper.text()).toContain('Électrik')
    const style = wrapper.attributes('style')
    expect(style).toContain('--c: #966E00')
  })

  it('affiche le multiplicateur quand il est fourni', async () => {
    const wrapper = await mountSuspended(TypeChip, { props: { type: 'ice', multiplier: 4, small: true } })
    expect(wrapper.find('.type-chip__mult').text()).toBe('×4')
    expect(wrapper.classes()).toContain('type-chip--sm')
  })
})

describe('DateFormula', () => {
  it('met en avant le dernier chiffre de chaque partie', async () => {
    const wrapper = await mountSuspended(DateFormula, { props: { date: { day: 17, month: 10, year: 2026 } } })
    expect(wrapper.findAll('.formula__digit').map((d) => d.text())).toEqual(['7', '0', '6'])
    expect(wrapper.find('.formula__num').text()).toBe('N° 706')
    expect(wrapper.find('.visually-hidden').text()).toContain('numéro 706')
  })

  it('explique le cas 000', async () => {
    const wrapper = await mountSuspended(DateFormula, { props: { date: { day: 10, month: 10, year: 2020 } } })
    expect(wrapper.text()).toContain('000 devient 1000')
  })
})

describe('AppFooter', () => {
  it('renvoie vers le portfolio dans un nouvel onglet', async () => {
    const wrapper = await mountSuspended(AppFooter)
    const link = wrapper.find('a[href="https://quentin-macq.dev"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('Quentin Macq')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toContain('noopener')
  })
})
