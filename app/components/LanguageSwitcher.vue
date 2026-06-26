<script setup lang="ts">
const { getLocale, getLocales, switchLocale, t } = useI18n()

const current = computed(() => getLocale())
const locales = computed(() => getLocales())

const items = computed(() =>
  locales.value.map(locale => ({
    label: locale.code === 'fr' ? t('common.french') : t('common.english'),
    icon: locale.code === 'fr' ? 'i-emojione-flag-for-france' : 'i-emojione-flag-for-united-kingdom',
    click: () => switchLocale(locale.code)
  }))
)

const currentLabel = computed(() =>
  current.value === 'fr' ? t('common.french') : t('common.english')
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
