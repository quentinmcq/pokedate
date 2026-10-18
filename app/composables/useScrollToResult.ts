import type { ShallowRef } from 'vue'

// The result section only renders once the Pokémon details have arrived, which can be after the navigation.
export function useScrollToResult(resultSection: Readonly<ShallowRef<HTMLElement | null>>) {
  let isWaitingForResult = false

  function scrollTo(element: HTMLElement) {
    isWaitingForResult = false
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    element.focus({ preventScroll: true })
  }

  watch(
    resultSection,
    (element) => {
      if (element && isWaitingForResult) scrollTo(element)
    },
    { flush: 'post' },
  )

  return async function scrollToResult() {
    await nextTick()
    if (resultSection.value) scrollTo(resultSection.value)
    else isWaitingForResult = true
  }
}
