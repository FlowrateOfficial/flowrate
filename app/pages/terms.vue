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
  'feedback',
  'disclaimers',
  'liability',
  'termination',
  'changes'
]

useSeoMeta({ title: () => t('legal.terms.seoTitle') })
</script>

<template>
  <UContainer class="py-16 max-w-3xl">
    <LegalPageIntro
      :title="t('legal.terms.title')"
      :last-updated-at="t('legal.terms.lastUpdatedAt')"
      :intro="t('legal.terms.intro')"
    >
      <template #see-also>
        <p class="text-sm text-primary font-medium mb-3 flex flex-wrap gap-x-4 gap-y-1">
          <NuxtLink to="/privacy" class="hover:underline">{{ t('legal.terms.seeAlsoPrivacy') }}</NuxtLink>
          <NuxtLink to="/glba" class="hover:underline">{{ t('legal.terms.seeAlsoGlba') }}</NuxtLink>
        </p>
      </template>
    </LegalPageIntro>

    <LegalSpeedInsights class="mb-10" />

    <LegalDocument base-key="legal.terms" :section-ids="sectionIds" />

    <p class="text-muted leading-relaxed mt-10">
      {{ t('legal.terms.contact') }}
      <a href="mailto:mathieu.lievre.pro@outlook.com" class="text-primary hover:underline">mathieu.lievre.pro@outlook.com</a>.
    </p>
  </UContainer>
</template>
