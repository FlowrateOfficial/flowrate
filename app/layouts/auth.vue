<script setup lang="ts">
const { homePath } = useSessionUser()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center surface-page p-6 sm:p-8">
    <div class="w-full max-w-md">
      <div class="text-center mb-12">
        <NuxtLink :to="homePath" class="inline-flex justify-center">
          <BrandFlowRateLogo :mark-size="34" />
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
