<script setup lang="ts">
import type { LandingFeature } from '~/stores/landing'

defineProps<{
  items: LandingFeature[]
}>()

const { t } = useAppI18n()
</script>

<template>
  <section id="features" class="bg-flow-warm dark:bg-flow-warm-dark py-24 sm:py-32">
    <UContainer>
      <div class="max-w-2xl mb-20">
        <p class="text-sm text-sage mb-4">03</p>
        <h2 class="text-display-section text-flow-ink dark:text-flow-ink-dark mb-6">
          {{ t('landing.featuresTitle') }}
        </h2>
        <p class="text-lg text-flow-muted dark:text-flow-muted-dark leading-relaxed">
          {{ t('landing.featuresDescription') }}
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
        <article
          v-for="item in items"
          :key="item.title"
          class="space-y-4"
        >
          <UIcon :name="item.icon" class="w-5 h-5 text-flow-muted dark:text-flow-muted-dark stroke-[1.25]" />
          <h3 class="font-display text-xl text-flow-ink dark:text-flow-ink-dark">
            {{ item.title }}
          </h3>
          <p class="text-[15px] text-flow-muted dark:text-flow-muted-dark leading-relaxed">
            {{ item.description }}
          </p>
        </article>
      </div>
    </UContainer>
  </section>
</template>
