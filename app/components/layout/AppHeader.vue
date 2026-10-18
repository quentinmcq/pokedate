<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'

const route = useRoute()
const { t, locale } = useLocaleTools()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const pageName = useCurrentPageName()
const { caughtCount } = usePokedex()
const homePath = useRememberedPath('home')
const challengesPath = useRememberedPath('challenges')
const pokedexPath = useRememberedPath('pokedex')

const navItems = computed(() => [
  {
    id: 'home',
    label: t('nav.home'),
    to: homePath.value,
    icon: 'lucide:calendar-heart',
    isActive: isSectionPage('home', pageName.value),
  },
  {
    id: 'challenges',
    label: t('nav.challenges'),
    to: challengesPath.value,
    icon: 'lucide:swords',
    isActive: isSectionPage('challenges', pageName.value),
  },
  {
    id: 'pokedex',
    label: t('nav.pokedex'),
    to: pokedexPath.value,
    icon: 'lucide:book-open',
    isActive: isSectionPage('pokedex', pageName.value) || pageName.value === 'pokemon-slug',
    showsCaughtCount: true,
  },
  {
    id: 'draws',
    label: t('nav.draws'),
    to: localePath('/tirages'),
    icon: 'lucide:radio-tower',
    isActive: pageName.value === 'tirages',
  },
])

const otherLocale = computed(() => (locale.value === 'fr' ? 'en' : 'fr'))

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
  () => [route.path, locale.value],
  () => nextTick(placeIndicator),
)
</script>

<template>
  <header class="site-header">
    <NuxtLinkLocale class="logo" to="/" :aria-label="t('nav.logo')">
      <PokeBall class="logo__ball" />
      <span>Poké<b>Date</b></span>
    </NuxtLinkLocale>
    <nav ref="nav" class="site-nav" :class="{ 'site-nav--measured': indicator }" :aria-label="t('nav.mainLabel')">
      <span
        class="site-nav__indicator"
        :class="{ 'site-nav__indicator--animated': isIndicatorAnimated }"
        :style="indicator ? { transform: `translateX(${indicator.left}px)`, width: `${indicator.width}px` } : undefined"
        aria-hidden="true"
      />
      <NuxtLink
        v-for="item in navItems"
        ref="navLinks"
        :key="item.id"
        :to="item.to"
        class="site-nav__link"
        :class="{ 'is-active': item.isActive }"
        :aria-current="item.isActive ? 'page' : undefined"
      >
        <Icon :name="item.icon" class="site-nav__icon" aria-hidden="true" />
        <span class="site-nav__label">{{ item.label }}</span>
        <span v-if="item.showsCaughtCount" class="pill"
          ><span class="visually-hidden">, </span>{{ caughtCount
          }}<span class="visually-hidden"> {{ t('nav.caught') }}</span></span
        >
      </NuxtLink>
    </nav>
    <NuxtLink
      class="language-switch"
      :to="switchLocalePath(otherLocale)"
      :hreflang="otherLocale"
      :lang="otherLocale"
      :aria-label="t('nav.otherLanguage')"
    >
      <Icon name="lucide:languages" aria-hidden="true" /> {{ otherLocale.toUpperCase() }}
    </NuxtLink>
  </header>
</template>

<style scoped lang="scss" src="./AppHeader.scss" />
