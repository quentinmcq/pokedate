<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'

const route = useRoute()
const { caughtCount } = usePokedex()
const homePath = useRememberedPath('home')
const challengesPath = useRememberedPath('challenges')

const navItems = computed(() => [
  {
    label: 'Mon Pokémon',
    to: homePath.value,
    icon: 'lucide:calendar-heart',
    isActive: isSectionPath('home', route.path),
  },
  {
    label: 'Défis',
    to: challengesPath.value,
    icon: 'lucide:swords',
    isActive: isSectionPath('challenges', route.path),
  },
  {
    label: 'Pokédex',
    to: '/pokedex',
    icon: 'lucide:book-open',
    isActive: route.path === '/pokedex' || route.path.startsWith('/pokemon'),
    showsCaughtCount: true,
  },
  { label: 'Tirages', to: '/tirages', icon: 'lucide:radio-tower', isActive: route.path === '/tirages' },
])

const nav = useTemplateRef<HTMLElement>('nav')
const navLinks = useTemplateRef<ComponentPublicInstance[]>('navLinks')
const indicator = ref<{ left: number; width: number } | null>(null)
const isIndicatorAnimated = ref(false)

function placeIndicator() {
  const activeIndex = navItems.value.findIndex((item) => item.isActive)
  const activeLink = navLinks.value?.[activeIndex]?.$el as HTMLElement | undefined
  indicator.value = activeLink ? { left: activeLink.offsetLeft, width: activeLink.offsetWidth } : null
}

let navResizeObserver: ResizeObserver | undefined
onMounted(() => {
  placeIndicator()
  // The first placement is instant; only later moves slide.
  requestAnimationFrame(() => requestAnimationFrame(() => (isIndicatorAnimated.value = true)))
  navResizeObserver = new ResizeObserver(placeIndicator)
  if (nav.value) navResizeObserver.observe(nav.value)
})
onBeforeUnmount(() => navResizeObserver?.disconnect())
watch(
  () => route.path,
  () => nextTick(placeIndicator),
)
</script>

<template>
  <header class="site-header">
    <NuxtLink class="logo" to="/" aria-label="PokéDate, accueil">
      <PokeBall class="logo__ball" />
      <span>Poké<b>Date</b></span>
    </NuxtLink>
    <nav ref="nav" class="site-nav" :class="{ 'site-nav--measured': indicator }" aria-label="Navigation principale">
      <span
        class="site-nav__indicator"
        :class="{ 'site-nav__indicator--animated': isIndicatorAnimated }"
        :style="indicator ? { transform: `translateX(${indicator.left}px)`, width: `${indicator.width}px` } : undefined"
        aria-hidden="true"
      />
      <NuxtLink
        v-for="item in navItems"
        ref="navLinks"
        :key="item.label"
        :to="item.to"
        class="site-nav__link"
        :class="{ 'is-active': item.isActive }"
        :aria-current="item.isActive ? 'page' : undefined"
      >
        <Icon :name="item.icon" class="site-nav__icon" aria-hidden="true" />
        <span class="site-nav__label">{{ item.label }}</span>
        <span v-if="item.showsCaughtCount" class="pill"
          ><span class="visually-hidden">, </span>{{ caughtCount }}<span class="visually-hidden"> attrapés</span></span
        >
      </NuxtLink>
    </nav>
  </header>
</template>

<style scoped lang="scss" src="./AppHeader.scss" />
