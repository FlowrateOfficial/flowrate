<script setup lang="ts">
const { t } = useAppI18n()
const { homePath } = useSessionUser()
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center surface-page p-6 sm:p-8">
    <NuxtLink
      :to="homePath"
      class="absolute top-5 left-5 sm:top-8 sm:left-8 inline-flex items-center gap-2 rounded-flow px-2 py-1.5 text-sm text-flow-muted dark:text-flow-muted-dark hover:text-flow-ink dark:hover:text-flow-ink-dark transition-colors"
      :aria-label="t('auth.backHome')"
    >
      <UIcon name="i-lucide-arrow-left" class="size-4 shrink-0" />
      <span class="hidden sm:inline">{{ t('auth.backHome') }}</span>
    </NuxtLink>

    <div class="w-full max-w-md">
      <div class="text-center mb-12">
        <NuxtLink :to="homePath" class="inline-flex flex-col items-center justify-center gap-2">
          <BrandFlowRateLogo :mark-size="34" />
          <AppBetaBadge size="sm" />
        </NuxtLink>
        <p class="text-sm text-flow-muted dark:text-flow-muted-dark mt-3 italic font-display">
          {{ $t('landing.heroSubtitle') }}
        </p>
      </div>

      <div class="editorial-card">
        <slot />
      </div>

      <div class="flex justify-center items-center gap-3 mt-8">
        <LanguageSwitcher />
        <UColorModeButton size="sm" color="neutral" variant="ghost" />
      </div>
    </div>
  </div>
</template>
