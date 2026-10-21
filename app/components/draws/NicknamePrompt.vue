<script setup lang="ts">
const emit = defineEmits<{ choose: [] }>()

const { nickname } = usePublishedDraws()
const { t } = useLocaleTools()

const STORAGE_KEY = 'pokedate.nickname-prompt-seen'
const DURATION_MS = 9000
// Lets the revealed Pokémon have the stage before the prompt asks for anything.
const DELAY_MS = 1500

// On phones the line under the card sits behind the bottom bar: the first publication says it once at the top.
const isShown = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function hasBeenSeen() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return true
  }
}

function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {}
}

const shouldPrompt = () => nickname.value === ANONYMOUS_NICKNAME && !hasBeenSeen()

function show() {
  if (!shouldPrompt()) return
  // Checked again after the delay: another card may have shown it, or a nickname may have been chosen meanwhile.
  timer = setTimeout(() => {
    if (!shouldPrompt()) return
    markSeen()
    isShown.value = true
    timer = setTimeout(hide, DURATION_MS)
  }, DELAY_MS)
}

function hide() {
  clearTimeout(timer)
  isShown.value = false
}

function choose() {
  hide()
  emit('choose')
}

onBeforeUnmount(hide)

defineExpose({ show, markSeen })
</script>

<template>
  <Teleport to="body">
    <Transition name="nickname-prompt">
      <aside v-if="isShown" class="nickname-prompt" :aria-label="t('publication.promptLabel')">
        <Icon name="lucide:users-round" class="nickname-prompt__icon" aria-hidden="true" />
        <p class="nickname-prompt__text">{{ t('publication.promptText') }}</p>
        <button class="btn btn--primary btn--sm" type="button" aria-haspopup="dialog" @click="choose">
          {{ t('publication.promptAction') }}
        </button>
        <button class="icon-btn nickname-prompt__close" type="button" :aria-label="t('common.close')" @click="hide">
          <Icon name="lucide:x" aria-hidden="true" />
        </button>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss" src="./NicknamePrompt.scss" />
