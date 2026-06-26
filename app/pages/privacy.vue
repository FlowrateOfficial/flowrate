<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useAppI18n()
useSeoMeta({ title: () => t('legal.privacy.seoTitle') })
</script>

<template>
  <UContainer class="py-16 max-w-3xl">
    <h1 class="text-3xl font-bold mb-2">{{ t('legal.privacy.title') }}</h1>
    <p class="text-sm text-muted mb-8">{{ t('legal.privacy.lastUpdated') }}</p>

    <div class="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted">
      <p>{{ t('legal.privacy.p1') }}</p>
      <p>{{ t('legal.privacy.p2') }}</p>
      <p>{{ t('legal.privacy.p3') }}</p>
      <p>
        {{ t('legal.privacy.p4') }}
        <a href="mailto:support@flowrate.app" class="text-primary hover:underline">support@flowrate.app</a>.
      </p>
    </div>
  </UContainer>
</template>
