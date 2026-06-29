<script setup lang="ts">
const { t } = useAppI18n()
</script>

<template>
  <LandingSection>
    <template #default>
      <div class="relative overflow-hidden py-28 sm:py-36">
        <div class="landing-mesh pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

        <div class="relative editorial-card p-10! sm:p-14! text-center max-w-3xl mx-auto landing-section-panel">
          <h2 class="text-display-section text-flow-ink dark:text-flow-ink-dark mb-6">
            {{ t('landing.ctaTitle') }}
          </h2>
          <p class="text-lg text-flow-muted dark:text-flow-muted-dark leading-relaxed mb-10 max-w-xl mx-auto">
            {{ t('landing.ctaDescription') }}
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <NuxtLink to="/auth/register" class="btn-primary-editorial text-base px-10 py-4">
              {{ t('landing.ctaButton') }}
              <UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
            </NuxtLink>
            <NuxtLink to="/#pricing" class="btn-secondary-editorial text-base px-8 py-4">
              {{ t('landing.ctaCompare') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </LandingSection>
</template>
