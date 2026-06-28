<script setup lang="ts">
import type { LandingPlan } from '~/stores/landing'

defineProps<{
  plans: LandingPlan[]
}>()

const { t } = useAppI18n()
const billingStore = useBillingStore()
const { pricingCadence } = storeToRefs(billingStore)
</script>

<template>
  <section id="pricing" class="py-24 sm:py-32 bg-flow-warm/40 dark:bg-flow-warm-dark/20">
    <UContainer>
      <div class="grid lg:grid-cols-12 gap-10 mb-16 sm:mb-20">
        <div class="lg:col-span-6 space-y-6">
          <p class="flow-section-label text-terracotta">05</p>
          <h2 class="text-display-section text-flow-ink dark:text-flow-ink-dark">
            {{ t('landing.pricingTitle') }}
          </h2>
        </div>
        <div class="lg:col-span-5 lg:col-start-8 flex flex-col justify-end gap-8">
          <p class="text-lg text-flow-muted dark:text-flow-muted-dark leading-relaxed">
            {{ t('landing.pricingDescription') }}
          </p>
          <div class="inline-flex self-start border border-flow-border dark:border-flow-border-dark rounded-flow p-1 bg-flow-card dark:bg-flow-card-dark">
            <button
              type="button"
              class="px-5 py-2 text-sm rounded-[0.5rem] transition-all duration-300"
              :class="pricingCadence === 'monthly' ? 'bg-charcoal dark:bg-flow-warm text-flow-warm dark:text-charcoal' : 'text-flow-muted'"
              @click="pricingCadence = 'monthly'"
            >
              {{ t('landing.pricing.monthly') }}
            </button>
            <button
              type="button"
              class="px-5 py-2 text-sm rounded-[0.5rem] transition-all duration-300"
              :class="pricingCadence === 'yearly' ? 'bg-charcoal dark:bg-flow-warm text-flow-warm dark:text-charcoal' : 'text-flow-muted'"
              @click="pricingCadence = 'yearly'"
            >
              {{ t('landing.pricing.yearly') }}
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-7">
        <article
          v-for="plan in plans"
          :key="plan.key"
          class="editorial-card-flat flex flex-col h-full relative"
          :class="plan.highlight ? 'lg:-mt-3 lg:mb-3 ring-1 ring-charcoal/8 dark:ring-flow-border-dark shadow-[0_8px_32px_rgba(25,25,25,0.06)]' : ''"
        >
          <UBadge
            v-if="plan.highlight"
            :label="t('landing.pricing.mostPopular')"
            color="neutral"
            class="absolute -top-3 left-8 !bg-terracotta !text-flow-warm font-normal"
            size="sm"
          />

          <header class="space-y-6 mb-10 pt-2">
            <p class="text-xs tracking-[0.14em] uppercase text-sage">
              {{ plan.target }}
            </p>
            <div>
              <h3 class="font-display text-3xl sm:text-4xl text-flow-ink dark:text-flow-ink-dark">
                {{ plan.name }}
              </h3>
              <p class="text-sm text-flow-muted dark:text-flow-muted-dark mt-3 leading-relaxed">
                {{ plan.targetDetail }}
              </p>
            </div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-4xl sm:text-5xl font-light tabular-nums text-flow-ink dark:text-flow-ink-dark tracking-tight">
                {{ plan.price }}
              </span>
              <span v-if="plan.period" class="text-flow-muted dark:text-flow-muted-dark text-sm">
                {{ plan.period }}
              </span>
            </div>
            <p v-if="plan.yearlyNote" class="text-xs text-sage">
              {{ plan.yearlyNote }}
            </p>
          </header>

          <div class="flex-1 space-y-8">
            <div>
              <p class="text-xs text-flow-muted dark:text-flow-muted-dark mb-4 tracking-wide">
                {{ t('landing.pricing.bestForLabel') }}
              </p>
              <ul class="space-y-2.5">
                <li
                  v-for="item in plan.bestFor"
                  :key="item"
                  class="text-sm text-flow-ink dark:text-flow-ink-dark leading-relaxed"
                >
                  {{ item }}
                </li>
              </ul>
            </div>

            <USeparator class="opacity-30" />

            <ul class="space-y-3">
              <li
                v-for="feat in plan.features"
                :key="feat"
                class="text-sm text-flow-muted dark:text-flow-muted-dark flex gap-3 leading-relaxed"
              >
                <UIcon name="i-lucide-check" class="w-4 h-4 text-sage shrink-0 mt-0.5 stroke-[1.25]" />
                {{ feat }}
              </li>
            </ul>
          </div>

          <footer class="mt-12 pt-2">
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
