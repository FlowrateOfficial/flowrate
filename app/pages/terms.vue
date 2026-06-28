<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useAppI18n()

const sectionIds = [
  'agreement',
  'service',
  'eligibility',
  'account',
  'financialData',
  'spaces',
  'billing',
  'acceptableUse',
  'disclaimers',
  'liability',
  'termination',
  'changes'
]

useSeoMeta({ title: () => t('legal.terms.seoTitle') })
</script>

<template>
  <UContainer class="py-16 max-w-3xl">
    <p class="text-sm text-primary font-medium mb-3">
      <NuxtLink to="/privacy" class="hover:underline">{{ t('legal.terms.seeAlsoPrivacy') }}</NuxtLink>
    </p>

    <h1 class="text-3xl font-bold mb-2">{{ t('legal.terms.title') }}</h1>
    <p class="text-sm text-muted mb-4">{{ t('legal.terms.lastUpdated') }}</p>
    <p class="text-muted leading-relaxed mb-10">{{ t('legal.terms.intro') }}</p>

    <LegalDocument base-key="legal.terms" :section-ids="sectionIds" />

    <p class="text-muted leading-relaxed mt-10">
      {{ t('legal.terms.contact') }}
      <a href="mailto:mathieu.lievre.pro@outlook.com" class="text-primary hover:underline">mathieu.lievre.pro@outlook.com</a>.
    </p>
  </UContainer>
</template>
