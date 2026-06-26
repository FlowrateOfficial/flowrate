<script setup lang="ts">
import type { LandingPlan } from '~/stores/landing'

defineProps<{
  plans: LandingPlan[]
}>()

const { t } = useAppI18n()
</script>

<template>
  <section id="pricing" class="py-24 sm:py-32">
    <UContainer>
      <div class="grid lg:grid-cols-12 gap-8 mb-20">
        <div class="lg:col-span-6">
          <p class="text-sm text-terracotta mb-4">05</p>
          <h2 class="text-display-section text-flow-ink dark:text-flow-ink-dark">
            {{ t('landing.pricingTitle') }}
          </h2>
        </div>
        <p class="lg:col-span-5 lg:col-start-8 text-lg text-flow-muted dark:text-flow-muted-dark self-end leading-relaxed">
          {{ t('landing.pricingDescription') }}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
        <article
          v-for="plan in plans"
          :key="plan.key"
          class="editorial-card flex flex-col h-full"
          :class="plan.highlight ? 'lg:-mt-4 lg:mb-4 ring-1 ring-charcoal/10 dark:ring-flow-border-dark' : ''"
        >
          <header class="space-y-6 mb-10">
            <p class="text-xs tracking-wide text-sage">
              {{ plan.target }}
            </p>
            <div>
              <h3 class="font-display text-3xl text-flow-ink dark:text-flow-ink-dark">
                {{ plan.name }}
              </h3>
              <p class="text-sm text-flow-muted dark:text-flow-muted-dark mt-2 leading-relaxed">
                {{ plan.targetDetail }}
              </p>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-light tabular-nums text-flow-ink dark:text-flow-ink-dark">
                {{ plan.price }}
              </span>
              <span v-if="plan.period" class="text-flow-muted dark:text-flow-muted-dark text-sm">
                {{ plan.period }}
              </span>
            </div>
          </header>

          <div class="flex-1 space-y-8">
            <div>
              <p class="text-xs text-flow-muted dark:text-flow-muted-dark mb-3">
                {{ t('landing.pricing.bestForLabel') }}
              </p>
              <ul class="space-y-2">
                <li
                  v-for="item in plan.bestFor"
                  :key="item"
                  class="text-sm text-flow-ink dark:text-flow-ink-dark"
                >
                  {{ item }}
                </li>
              </ul>
            </div>

            <USeparator class="opacity-40" />

            <ul class="space-y-2.5">
              <li
                v-for="feat in plan.features"
                :key="feat"
                class="text-sm text-flow-muted dark:text-flow-muted-dark flex gap-2"
              >
                <span class="text-sage">—</span>
                {{ feat }}
              </li>
            </ul>
          </div>

          <footer class="mt-10 pt-6">
            <NuxtLink
              :to="plan.to"
              :class="plan.highlight ? 'btn-primary-editorial w-full' : 'btn-secondary-editorial w-full'"
            >
              {{ plan.cta }}
            </NuxtLink>
          </footer>
        </article>
      </div>
    </UContainer>
  </section>
</template>
