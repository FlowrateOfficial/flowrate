<script setup lang="ts">
import type { LandingFeature } from '~/stores/landing'

defineProps<{
  items: LandingFeature[]
}>()

const { t } = useAppI18n()
</script>

<template>
  <LandingSection id="features" index="04" tinted>
    <template #default>
      <div class="py-24 sm:py-32">
        <div class="max-w-2xl mb-20 landing-section-intro">
          <p class="text-sm text-sage mb-4">04</p>
          <h2 class="text-display-section text-flow-ink dark:text-flow-ink-dark mb-6">
            {{ t('landing.featuresTitle') }}
          </h2>
          <p class="text-lg text-flow-muted dark:text-flow-muted-dark leading-relaxed">
            {{ t('landing.featuresDescription') }}
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-12 landing-section-panel">
          <article
            v-for="(item, i) in items"
            :key="item.title"
            class="space-y-4 landing-stagger group"
            :style="{ '--stagger': `${i * 0.06}s` }"
          >
            <div class="inline-flex size-10 items-center justify-center rounded-flow border border-flow-border/60 dark:border-flow-border-dark/60 bg-flow-card dark:bg-flow-card-dark transition-transform duration-300 group-hover:-translate-y-0.5">
              <UIcon :name="item.icon" class="w-5 h-5 text-sage stroke-[1.25]" />
            </div>
            <h3 class="font-display text-xl text-flow-ink dark:text-flow-ink-dark">
              {{ item.title }}
            </h3>
            <p class="text-[15px] text-flow-muted dark:text-flow-muted-dark leading-relaxed">
              {{ item.description }}
            </p>
          </article>
        </div>
      </div>
    </template>
  </LandingSection>
</template>
