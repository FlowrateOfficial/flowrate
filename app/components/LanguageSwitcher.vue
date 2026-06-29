<script setup lang="ts">
const { getLocale, getLocales, switchLocale, t } = useAppI18n()

const localeLabels: Record<string, string> = {
  en: 'common.englishUS',
  'en-GB': 'common.englishUK',
  fr: 'common.french'
}

const localeIcons: Record<string, string> = {
  en: 'i-lucide-dollar-sign',
  'en-GB': 'i-lucide-pound-sterling',
  fr: 'i-lucide-euro'
}

const current = computed(() => getLocale())
const locales = computed(() => getLocales())

const items = computed(() =>
  locales.value.map(locale => ({
    label: t(localeLabels[locale.code] ?? 'common.english'),
    icon: localeIcons[locale.code] ?? 'i-lucide-globe',
    onSelect: () => switchLocale(locale.code)
  }))
)

const currentLabel = computed(() =>
  t(localeLabels[current.value] ?? 'common.english')
)
</script>

<template>
  <UDropdownMenu :items="[items]">
    <UButton
      :label="currentLabel"
      icon="i-lucide-languages"
      color="neutral"
      variant="ghost"
      size="sm"
      :aria-label="t('common.language')"
    />
  </UDropdownMenu>
</template>
