<script setup lang="ts">
import type { LandingPlan } from '~/stores/landing'

const props = defineProps<{
  plans: LandingPlan[]
}>()

const { t } = useAppI18n()
const billingStore = useBillingStore()
const { pricingCadence } = storeToRefs(billingStore)

const carouselRef = ref<HTMLElement | null>(null)
const activePlan = ref(0)

function scrollToIndex(index: number) {
  const root = carouselRef.value
  if (!root) return
  const clamped = Math.max(0, Math.min(props.plans.length - 1, index))
  const card = root.querySelector<HTMLElement>(`[data-plan-index="${clamped}"]`)
  card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  activePlan.value = clamped
}

function onCarouselScroll() {
  const root = carouselRef.value
  if (!root) return

  const center = root.scrollLeft + root.clientWidth / 2
  let closest = 0
  let minDist = Infinity

  root.querySelectorAll<HTMLElement>('[data-plan-index]').forEach((card) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2
    const dist = Math.abs(cardCenter - center)
    const index = Number(card.dataset.planIndex)
    if (dist < minDist) {
      minDist = dist
      closest = index
    }
  })

  activePlan.value = closest
}

function planCardClass(plan: LandingPlan) {
  return [
    'editorial-card-flat flex flex-col h-full relative landing-stagger snap-center shrink-0',
    'w-[min(100%,18.5rem)] sm:w-[20rem] lg:w-auto lg:shrink',
    plan.highlight
      ? 'lg:-mt-3 lg:mb-3 ring-1 ring-charcoal/8 dark:ring-flow-border-dark shadow-[0_8px_32px_rgba(25,25,25,0.06)]'
      : ''
  ]
}
</script>

<template>
  <LandingSection id="pricing" index="06">
    <template #default>
      <div class="py-24 sm:py-32">
        <div class="grid lg:grid-cols-12 gap-10 mb-16 sm:mb-20 landing-section-intro">
          <div class="lg:col-span-6 space-y-6">
            <p class="flow-section-label text-terracotta">06</p>
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
                :class="pricingCadence === 'monthly' ? 'btn-segment-active' : 'text-flow-muted dark:text-flow-muted-dark'"
                @click="pricingCadence = 'monthly'"
              >
                {{ t('landing.pricing.monthly') }}
              </button>
              <button
                type="button"
                class="px-5 py-2 text-sm rounded-[0.5rem] transition-all duration-300"
                :class="pricingCadence === 'yearly' ? 'btn-segment-active' : 'text-flow-muted dark:text-flow-muted-dark'"
                @click="pricingCadence = 'yearly'"
              >
                {{ t('landing.pricing.yearly') }}
              </button>
            </div>
          </div>
        </div>

        <div class="relative landing-section-panel">
          <div class="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-10 bg-gradient-to-r from-flow-bg dark:from-flow-bg-dark to-transparent sm:block lg:hidden" />
          <div class="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-10 bg-gradient-to-l from-flow-bg dark:from-flow-bg-dark to-transparent sm:block lg:hidden" />

          <UButton
            v-if="activePlan > 0"
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="outline"
            size="sm"
            class="absolute left-0 top-1/2 z-20 -translate-y-1/2 lg:hidden shadow-sm"
            :aria-label="t('landing.pricing.prevPlan')"
            @click="scrollToIndex(activePlan - 1)"
          />
          <UButton
            v-if="activePlan < plans.length - 1"
            icon="i-lucide-chevron-right"
            color="neutral"
            variant="outline"
            size="sm"
            class="absolute right-0 top-1/2 z-20 -translate-y-1/2 lg:hidden shadow-sm"
            :aria-label="t('landing.pricing.nextPlan')"
            @click="scrollToIndex(activePlan + 1)"
          />

          <div
            ref="carouselRef"
            class="pricing-carousel flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-4 px-4 sm:px-6
                   lg:grid lg:grid-cols-3 lg:gap-7 lg:overflow-visible lg:snap-none lg:mx-0 lg:px-0"
            @scroll.passive="onCarouselScroll"
          >
            <article
              v-for="(plan, index) in plans"
              :key="plan.key"
              :data-plan-index="index"
              :class="planCardClass(plan)"
              :style="{ '--stagger': '0.05s' }"
            >
              <header class="space-y-6 mb-10">
                <UBadge
                  v-if="plan.highlight"
                  :label="t('landing.pricing.mostPopular')"
                  color="neutral"
                  class="!bg-terracotta !text-flow-warm font-normal"
                  size="sm"
                />

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

          <div
            class="flex justify-center gap-2 mt-6 lg:hidden"
            role="tablist"
            :aria-label="t('landing.pricing.planCarousel')"
          >
            <button
              v-for="(plan, index) in plans"
              :key="`dot-${plan.key}`"
              type="button"
              role="tab"
              :aria-selected="activePlan === index"
              :aria-label="plan.name"
              class="size-2 rounded-full transition-colors"
              :class="activePlan === index ? 'bg-charcoal dark:bg-flow-ink-dark' : 'bg-flow-border dark:bg-flow-border-dark'"
              @click="scrollToIndex(index)"
            />
          </div>

          <p class="mt-3 text-center text-xs text-flow-muted dark:text-flow-muted-dark lg:hidden">
            {{ t('landing.pricing.swipeHint') }}
          </p>
        </div>
      </div>
    </template>
  </LandingSection>
</template>
