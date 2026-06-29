<script setup lang="ts">
const props = defineProps<{
  title: string
  lastUpdatedAt: string
  intro: string
}>()

const { t, intlLocale } = useAppI18n()

const lastUpdated = computed(() => {
  const date = new Date(props.lastUpdatedAt)
  const datetime = new Intl.DateTimeFormat(intlLocale.value, {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC'
  }).format(date)

  return t('legal.lastUpdatedLabel', { datetime })
})
</script>

<template>
  <AppBetaBadge show-hint class="mb-4" />

  <slot name="see-also" />

  <h1 class="text-3xl font-bold mb-2">
    {{ title }}
  </h1>
  <p class="text-sm text-muted mb-4">
    <time :datetime="lastUpdatedAt">{{ lastUpdated }}</time>
  </p>
  <p class="text-muted leading-relaxed mb-6">
    {{ intro }}
  </p>

  <div class="legal-beta-notice mb-10" role="note">
    <UIcon name="i-lucide-triangle-alert" class="legal-beta-notice-icon" aria-hidden="true" />
    <p class="text-sm leading-relaxed">
      {{ t('legal.betaNotice') }}
    </p>
  </div>
</template>
