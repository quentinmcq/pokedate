<script setup lang="ts">
const props = defineProps<{ question: string; group: string }>()

const ANIMATION_OPTIONS: KeyframeAnimationOptions = {
  duration: 300,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
  fill: 'forwards',
}

const itemId = useId()
const openItemId = useState<string | null>(`accordion:${props.group}`, () => null)
const details = useTemplateRef<HTMLDetailsElement>('details')
const answer = useTemplateRef<HTMLElement>('answer')
const isEnhanced = ref(false)
const isExpanded = ref(false)
let heightAnimation: Animation | undefined

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function animateAnswerHeight(fromHeight: number, toHeight: number) {
  heightAnimation?.cancel()
  if (!answer.value || prefersReducedMotion()) return Promise.resolve(true)
  heightAnimation = answer.value.animate(
    [{ height: `${fromHeight}px` }, { height: `${toHeight}px` }],
    ANIMATION_OPTIONS,
  )
  return heightAnimation.finished.then(
    () => true,
    () => false,
  )
}

async function expand() {
  if (!details.value || !answer.value) return
  const startHeight = details.value.open ? answer.value.offsetHeight : 0
  details.value.open = true
  isExpanded.value = true
  openItemId.value = itemId
  if (await animateAnswerHeight(startHeight, answer.value.scrollHeight)) heightAnimation?.cancel()
}

async function collapse() {
  if (!details.value?.open || !answer.value) return
  isExpanded.value = false
  if (!(await animateAnswerHeight(answer.value.offsetHeight, 0))) return
  details.value.open = false
  heightAnimation?.cancel()
}

function toggle(event: MouseEvent) {
  event.preventDefault()
  if (!isExpanded.value) return expand()
  if (openItemId.value === itemId) openItemId.value = null
  collapse()
}

watch(openItemId, (openId) => openId !== itemId && collapse())

onMounted(() => {
  // Native exclusivity would close the previous item instantly; the group state closes it with an animation instead.
  details.value?.removeAttribute('name')
  isEnhanced.value = true
})
</script>

<template>
  <details
    ref="details"
    class="accordion"
    :class="{ 'accordion--enhanced': isEnhanced, 'accordion--expanded': isExpanded }"
    :name="group"
  >
    <summary class="accordion__question" @click="toggle">
      {{ question }}
      <Icon name="lucide:plus" class="accordion__icon" aria-hidden="true" />
    </summary>
    <div ref="answer" class="accordion__answer"><slot /></div>
  </details>
</template>

<style scoped lang="scss" src="./AccordionItem.scss" />
