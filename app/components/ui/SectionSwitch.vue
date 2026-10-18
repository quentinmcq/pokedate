<script setup lang="ts">
export interface SectionSwitchOption {
  label: string
  to: string
  icon: string
}

const props = defineProps<{ label: string; options: readonly SectionSwitchOption[] }>()

const route = useRoute()
const activeIndex = computed(() => props.options.findIndex((option) => option.to === route.path))
</script>

<template>
  <nav class="section-switch" :aria-label="label" :style="{ '--active-index': activeIndex }">
    <span class="section-switch__indicator" aria-hidden="true" />
    <NuxtLink
      v-for="(option, index) in options"
      :key="option.to"
      :to="option.to"
      class="section-switch__option"
      :class="{ 'is-active': index === activeIndex }"
      :aria-current="index === activeIndex ? 'page' : undefined"
    >
      <Icon :name="option.icon" class="section-switch__icon" aria-hidden="true" /> {{ option.label }}
    </NuxtLink>
  </nav>
</template>

<style scoped lang="scss" src="./SectionSwitch.scss" />
