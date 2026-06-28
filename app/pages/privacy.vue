<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useAppI18n()

const sectionIds = [
  'overview',
  'dataCollected',
  'financialConnections',
  'howWeUse',
  'analytics',
  'sharing',
  'subprocessors',
  'storage',
  'retention',
  'yourRights',
  'security',
  'spaces',
  'children',
  'cookies',
  'international',
  'changes'
]

useSeoMeta({ title: () => t('legal.privacy.seoTitle') })
</script>

<template>
  <UContainer class="py-16 max-w-3xl">
    <p class="text-sm text-primary font-medium mb-3">
      <NuxtLink to="/terms" class="hover:underline">{{ t('legal.privacy.seeAlsoTerms') }}</NuxtLink>
    </p>

    <h1 class="text-3xl font-bold mb-2">{{ t('legal.privacy.title') }}</h1>
    <p class="text-sm text-muted mb-4">{{ t('legal.privacy.lastUpdated') }}</p>
    <p class="text-muted leading-relaxed mb-10">{{ t('legal.privacy.intro') }}</p>

    <LegalDocument base-key="legal.privacy" :section-ids="sectionIds" />

    <p class="text-muted leading-relaxed mt-10">
      {{ t('legal.privacy.contact') }}
      <a href="mailto:mathieu.lievre.pro@outlook.com" class="text-primary hover:underline">mathieu.lievre.pro@outlook.com</a>.
    </p>
  </UContainer>
</template>
