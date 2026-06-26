<script setup lang="ts">
const { t } = useAppI18n()
</script>

<template>
  <section class="py-28 sm:py-36 bg-flow-secondary/50 dark:bg-flow-secondary-dark/40">
    <UContainer>
      <div class="grid lg:grid-cols-12 gap-12 items-center">
        <div class="lg:col-span-7 space-y-6">
          <h2 class="text-display-section text-flow-ink dark:text-flow-ink-dark">
            {{ t('landing.ctaTitle') }}
          </h2>
          <p class="text-lg text-flow-muted dark:text-flow-muted-dark max-w-lg leading-relaxed">
            {{ t('landing.ctaDescription') }}
          </p>
        </div>
        <div class="lg:col-span-5 lg:flex lg:justify-end">
          <NuxtLink to="/auth/register" class="btn-primary-editorial text-base px-10 py-4">
            {{ t('landing.ctaButton') }}
            <UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>
      </div>
    </UContainer>
  </section>
</template>
