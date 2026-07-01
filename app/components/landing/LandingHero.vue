<script setup lang="ts">
import { storeToRefs } from 'pinia'

const { t } = useAppI18n()
const landing = useLandingStore()
const { morphPhrases, demoActiveIndex } = storeToRefs(landing)

const featureStrip = computed(() => [
  { icon: 'i-lucide-layers', label: t('landing.featureStrip.spaces') },
  { icon: 'i-lucide-shield-check', label: t('landing.featureStrip.saasShield') },
  { icon: 'i-lucide-flame', label: t('landing.featureStrip.burnRate') },
  { icon: 'i-lucide-user-round', label: t('landing.featureStrip.teen') },
  { icon: 'i-lucide-sparkles', label: t('landing.featureStrip.ai') }
])
</script>

<template>
  <section class="relative overflow-hidden landing-hero-glow min-h-[90vh] flex flex-col">
    <UContainer class="py-20 sm:py-28 lg:py-32 flex-1 flex flex-col justify-center">
      <div class="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
        <div class="lg:col-span-5 xl:col-span-5 space-y-8 animate-flow-fade-up">
          <div class="flex flex-wrap items-center gap-3">
            <p class="flow-section-label text-sage mb-0">
              {{ t('landing.heroTagline') }}
            </p>
            <AppBetaBadge show-hint />
          </div>
          <h1 class="text-display-hero text-flow-ink dark:text-flow-ink-dark">
            <span class="block">{{ t('landing.heroTitleLine1') }}</span>
            <LandingMorphText
              tag="span"
              class="block text-terracotta italic font-display mt-1"
              :phrases="morphPhrases"
              :interval-ms="4800"
              :active-index="demoActiveIndex"
            />
          </h1>
          <p class="font-display text-xl sm:text-2xl text-flow-muted dark:text-flow-muted-dark italic leading-relaxed max-w-md">
            {{ t('landing.heroSubtitle') }}
          </p>
          <p class="text-lg text-flow-muted dark:text-flow-muted-dark max-w-md leading-[1.75]">
            {{ t('landing.heroDescription') }}
          </p>
          <div class="flex flex-wrap gap-4 pt-2">
            <NuxtLink
              to="/auth/register"
              class="btn-primary-editorial"
            >
              {{ t('common.getStartedFree') }}
              <UIcon
                name="i-lucide-arrow-right"
                class="w-4 h-4 stroke-[1.25]"
              />
            </NuxtLink>
            <NuxtLink
              to="/#demo"
              class="btn-secondary-editorial"
            >
              {{ t('landing.seeHow') }}
            </NuxtLink>
          </div>
          <p class="text-sm text-flow-muted dark:text-flow-muted-dark flex items-center gap-2 pt-2">
            <UIcon
              name="i-lucide-check-circle"
              class="size-4 text-sage shrink-0"
            />
            {{ t('landing.heroTrust') }}
          </p>
        </div>

        <div class="lg:col-span-7 xl:col-span-7 animate-flow-fade-up animate-flow-delay-1">
          <LandingHeroVisual />
        </div>
      </div>

      <div class="mt-16 sm:mt-24 pt-10 border-t border-flow-border/50 dark:border-flow-border-dark/50">
        <div class="flex flex-wrap justify-center lg:justify-between gap-x-10 gap-y-6">
          <div
            v-for="item in featureStrip"
            :key="item.label"
            class="flex items-center gap-3 text-flow-muted dark:text-flow-muted-dark"
          >
            <UIcon
              :name="item.icon"
              class="w-4 h-4 stroke-[1.25] shrink-0"
            />
            <span class="text-sm tracking-wide">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </UContainer>

    <NuxtLink
      to="/#demo"
      class="landing-scroll-hint"
      :aria-label="t('landing.scrollHint')"
    >
      <span class="text-xs tracking-[0.2em] uppercase text-flow-muted">{{ t('landing.scrollHint') }}</span>
      <UIcon
        name="i-lucide-arrow-down"
        class="size-4 landing-scroll-arrow"
      />
    </NuxtLink>
  </section>
</template>
