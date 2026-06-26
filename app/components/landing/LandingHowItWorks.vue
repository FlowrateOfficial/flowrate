<script setup lang="ts">
import type { LandingFeature } from '~/stores/landing'

defineProps<{
  items: LandingFeature[]
}>()

const { t } = useAppI18n()
</script>

<template>
  <section id="how-it-works" class="bg-flow-secondary/40 dark:bg-flow-secondary-dark/30">
    <UContainer class="py-24 sm:py-32">
      <div class="grid lg:grid-cols-12 gap-16 lg:gap-20">
        <div class="lg:col-span-4 lg:pt-8">
          <p class="text-sm text-sage mb-4">01</p>
          <h2 class="text-display-section text-flow-ink dark:text-flow-ink-dark mb-6">
            {{ t('landing.howItWorks.title') }}
          </h2>
          <p class="text-lg text-flow-muted dark:text-flow-muted-dark leading-relaxed">
            {{ t('landing.howItWorks.description') }}
          </p>
        </div>

        <div class="lg:col-span-8 space-y-0 divide-y divide-flow-border/60 dark:divide-flow-border-dark/60">
          <article
            v-for="(item, i) in items"
            :key="item.title"
            class="grid sm:grid-cols-12 gap-6 py-12 first:pt-0 last:pb-0 group"
          >
            <div class="sm:col-span-2">
              <span class="text-sm text-flow-muted dark:text-flow-muted-dark tabular-nums">
                {{ String(i + 1).padStart(2, '0') }}
              </span>
            </div>
            <div class="sm:col-span-10 flex gap-6">
              <UIcon
                :name="item.icon"
                class="w-5 h-5 text-sage shrink-0 mt-1 stroke-[1.25]"
              />
              <div class="space-y-3 max-w-xl">
                <h3 class="font-display text-2xl text-flow-ink dark:text-flow-ink-dark">
                  {{ item.title }}
                </h3>
                <p class="text-flow-muted dark:text-flow-muted-dark leading-relaxed">
                  {{ item.description }}
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </UContainer>
  </section>
</template>
