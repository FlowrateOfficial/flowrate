<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useAppI18n()

const sectionIds = [
  'purpose',
  'scope',
  'npiDefinition',
  'whatWeCollect',
  'howWeCollect',
  'howWeUse',
  'sharing',
  'optOut',
  'safeguards',
  'retention',
  'formerCustomers',
  'otherNotices',
  'changes'
]

useSeoMeta({ title: () => t('legal.glba.seoTitle') })
</script>

<template>
  <UContainer class="py-16 max-w-3xl">
    <LegalPageIntro
      :title="t('legal.glba.title')"
      :last-updated-at="t('legal.glba.lastUpdatedAt')"
      :intro="t('legal.glba.intro')"
    >
      <template #see-also>
        <p class="text-sm text-primary font-medium mb-3 flex flex-wrap gap-x-4 gap-y-1">
          <NuxtLink
            to="/privacy"
            class="hover:underline"
          >{{ t('legal.glba.seeAlsoPrivacy') }}</NuxtLink>
          <NuxtLink
            to="/terms"
            class="hover:underline"
          >{{ t('legal.glba.seeAlsoTerms') }}</NuxtLink>
        </p>
      </template>
    </LegalPageIntro>

    <LegalSpeedInsights class="mb-10" />

    <LegalDocument
      base-key="legal.glba"
      :section-ids="sectionIds"
    />

    <p class="text-muted leading-relaxed mt-10">
      {{ t('legal.glba.contact') }}
      <a
        href="mailto:mathieu.lievre.pro@outlook.com"
        class="text-primary hover:underline"
      >mathieu.lievre.pro@outlook.com</a>.
    </p>
  </UContainer>
</template>
