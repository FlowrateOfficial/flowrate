<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useAppI18n()

const sectionIds = [
  'overview',
  'dataCollected',
  'financialConnections',
  'howWeUse',
  'analytics',
  'ai',
  'feedback',
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
    <LegalPageIntro
      :title="t('legal.privacy.title')"
      :last-updated-at="t('legal.privacy.lastUpdatedAt')"
      :intro="t('legal.privacy.intro')"
    >
      <template #see-also>
        <p class="text-sm text-primary font-medium mb-3 flex flex-wrap gap-x-4 gap-y-1">
          <NuxtLink to="/terms" class="hover:underline">{{ t('legal.privacy.seeAlsoTerms') }}</NuxtLink>
          <NuxtLink to="/glba" class="hover:underline">{{ t('legal.privacy.seeAlsoGlba') }}</NuxtLink>
        </p>
      </template>
    </LegalPageIntro>

    <LegalSpeedInsights class="mb-10" />

    <LegalDocument base-key="legal.privacy" :section-ids="sectionIds" />

    <p class="text-muted leading-relaxed mt-10">
      {{ t('legal.privacy.contact') }}
      <a href="mailto:mathieu.lievre.pro@outlook.com" class="text-primary hover:underline">mathieu.lievre.pro@outlook.com</a>.
    </p>
  </UContainer>
</template>
