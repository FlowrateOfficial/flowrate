<script setup lang="ts">
defineProps<{
  title: string
  lastUpdated: string
  intro: string
}>()

const { t } = useAppI18n()
</script>

<template>
  <AppBetaBadge show-hint class="mb-4" />

  <slot name="see-also" />

  <h1 class="text-3xl font-bold mb-2">
    {{ title }}
  </h1>
  <p class="text-sm text-muted mb-4">
    {{ lastUpdated }}
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
