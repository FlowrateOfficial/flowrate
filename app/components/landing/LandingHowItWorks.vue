<script setup lang="ts">
import type { LandingFeature } from '~/stores/landing'

defineProps<{
  items: LandingFeature[]
}>()

const { t } = useAppI18n()

const stepPreviews = computed(() => [
  { icon: 'i-lucide-landmark', metric: t('landing.howItWorks.previews.connect') },
  { icon: 'i-lucide-layers', metric: t('landing.howItWorks.previews.organize') },
  { icon: 'i-lucide-trending-up', metric: t('landing.howItWorks.previews.act') }
])
</script>

<template>
  <LandingSection id="how-it-works" index="01" tinted>
    <template #default>
      <div class="py-24 sm:py-32">
        <div class="max-w-2xl mb-16 sm:mb-20 landing-section-intro">
          <p class="text-sm text-sage mb-4">01</p>
          <h2 class="text-display-section text-flow-ink dark:text-flow-ink-dark mb-6">
            {{ t('landing.howItWorks.title') }}
          </h2>
          <p class="text-lg text-flow-muted dark:text-flow-muted-dark leading-relaxed">
            {{ t('landing.howItWorks.description') }}
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-6 lg:gap-8 landing-section-panel">
          <article
            v-for="(item, i) in items"
            :key="item.title"
            class="editorial-card landing-step-card landing-stagger"
            :style="{ '--stagger': `${i * 0.1}s` }"
          >
            <div class="flex items-center justify-between mb-6">
              <span class="text-sm text-flow-muted dark:text-flow-muted-dark tabular-nums">
                {{ String(i + 1).padStart(2, '0') }}
              </span>
              <UIcon :name="item.icon" class="size-5 text-sage stroke-[1.25]" />
            </div>

            <h3 class="font-display text-2xl text-flow-ink dark:text-flow-ink-dark mb-3">
              {{ item.title }}
            </h3>
            <p class="text-flow-muted dark:text-flow-muted-dark leading-relaxed mb-6">
              {{ item.description }}
            </p>

            <div class="rounded-flow border border-flow-border/50 dark:border-flow-border-dark/50 bg-flow-warm/70 dark:bg-flow-elevated-dark/50 px-3 py-2.5 flex items-center gap-2">
              <UIcon :name="stepPreviews[i]!.icon" class="size-4 text-terracotta shrink-0" />
              <span class="text-sm text-flow-ink dark:text-flow-ink-dark">{{ stepPreviews[i]!.metric }}</span>
            </div>
          </article>
        </div>
      </div>
    </template>
  </LandingSection>
</template>
