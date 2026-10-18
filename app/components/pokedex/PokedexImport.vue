<script setup lang="ts">
import type { Discoveries } from '~/composables/usePokedex'

const props = defineProps<{ incoming: Discoveries }>()
const emit = defineEmits<{ done: [] }>()

const { importDiscoveries } = usePokedex()
const { showToast } = useToast()
const trackEvent = useTrackEvent()
const { t } = useLocaleTools()

const incomingCaughtCount = computed(() => Object.values(props.incoming).filter((discovery) => discovery.caught).length)
const incomingSeenCount = computed(() => Object.keys(props.incoming).length - incomingCaughtCount.value)

function acceptImport() {
  const newlyCaught = importDiscoveries(props.incoming)
  trackEvent('import')
  showToast(newlyCaught ? t('import.added', { count: newlyCaught }, newlyCaught) : t('import.upToDate'))
  emit('done')
}
</script>

<template>
  <section class="import" aria-labelledby="import-title">
    <Icon name="lucide:download" class="import__icon" aria-hidden="true" />
    <div>
      <h2 id="import-title" class="import__title">{{ t('import.title') }}</h2>
      <p>
        {{
          incomingSeenCount
            ? t('import.summaryWithSeen', {
                caught: t('import.caught', { count: incomingCaughtCount }, incomingCaughtCount),
                seen: t('import.seen', { count: incomingSeenCount }, incomingSeenCount),
              })
            : t('import.summary', { caught: t('import.caught', { count: incomingCaughtCount }, incomingCaughtCount) })
        }}
      </p>
      <div class="actions">
        <button class="btn btn--primary btn--sm" type="button" @click="acceptImport">{{ t('import.accept') }}</button>
        <button class="btn btn--ghost btn--sm" type="button" @click="emit('done')">{{ t('import.ignore') }}</button>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss" src="./PokedexImport.scss" />
