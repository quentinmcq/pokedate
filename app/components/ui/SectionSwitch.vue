<script setup lang="ts">
export interface SectionSwitchOption {
  label: string
  to: string
  icon: string
}

const props = defineProps<{ label: string; options: readonly SectionSwitchOption[] }>()

const route = useRoute()
const currentIndex = computed(() => props.options.findIndex((option) => option.to === route.path))
// The indicator moves on tap: the next page can take a moment to render on a phone.
const requestedIndex = ref<number | null>(null)
const activeIndex = computed(() => requestedIndex.value ?? currentIndex.value)
// The page route only changes once the next page has rendered, after the router navigation has resolved.
watch(currentIndex, () => (requestedIndex.value = null))

const afterNextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

async function switchTo(index: number, event: MouseEvent, navigate: () => Promise<unknown>) {
  const opensElsewhere = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0
  if (opensElsewhere) return
  event.preventDefault()
  if (index === currentIndex.value) return
  requestedIndex.value = index
  await afterNextPaint()
  const navigationFailure = await navigate()
  if (navigationFailure) requestedIndex.value = null
}
</script>

<template>
  <nav class="section-switch" :aria-label="label" :style="{ '--active-index': activeIndex }">
    <span class="section-switch__indicator" aria-hidden="true" />
    <NuxtLink v-for="(option, index) in options" :key="option.to" v-slot="{ href, navigate }" :to="option.to" custom>
      <a
        :href="href ?? undefined"
        class="section-switch__option"
        :class="{ 'is-active': index === activeIndex }"
        :aria-current="index === currentIndex ? 'page' : undefined"
        @click="switchTo(index, $event, navigate)"
      >
        <Icon :name="option.icon" class="section-switch__icon" aria-hidden="true" /> {{ option.label }}
      </a>
    </NuxtLink>
  </nav>
</template>

<style scoped lang="scss" src="./SectionSwitch.scss" />
