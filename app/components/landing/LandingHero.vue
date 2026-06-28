<script setup lang="ts">
import { storeToRefs } from 'pinia'

const { t } = useAppI18n()
const landing = useLandingStore()
const { heroSpaceCards } = storeToRefs(landing)

const featureStrip = computed(() => [
  { icon: 'i-lucide-layers', label: t('landing.featureStrip.spaces') },
  { icon: 'i-lucide-shield-check', label: t('landing.featureStrip.saasShield') },
  { icon: 'i-lucide-flame', label: t('landing.featureStrip.burnRate') },
  { icon: 'i-lucide-user-round', label: t('landing.featureStrip.teen') },
  { icon: 'i-lucide-sparkles', label: t('landing.featureStrip.ai') }
])
</script>

<template>
  <section class="relative overflow-hidden">
    <UContainer class="py-20 sm:py-28 lg:py-36">
      <div class="grid lg:grid-cols-12 gap-16 lg:gap-10 items-center">
        <div class="lg:col-span-5 xl:col-span-5 space-y-10 animate-flow-fade-up">
          <p class="flow-section-label text-sage">
            {{ t('landing.heroTagline') }}
          </p>
          <h1 class="text-display-hero text-flow-ink dark:text-flow-ink-dark">
            {{ t('landing.heroTitle') }}
          </h1>
          <p class="font-display text-xl sm:text-2xl text-flow-muted dark:text-flow-muted-dark italic leading-relaxed max-w-md">
            {{ t('landing.heroSubtitle') }}
          </p>
          <p class="text-lg text-flow-muted dark:text-flow-muted-dark max-w-md leading-[1.75]">
            {{ t('landing.heroDescription') }}
          </p>
          <div class="flex flex-wrap gap-4 pt-2">
            <NuxtLink to="/auth/register" class="btn-primary-editorial">
              {{ t('common.getStartedFree') }}
              <UIcon name="i-lucide-arrow-right" class="w-4 h-4 stroke-[1.25]" />
            </NuxtLink>
            <NuxtLink to="/#how-it-works" class="btn-secondary-editorial">
              {{ t('landing.seeHow') }}
            </NuxtLink>
          </div>
        </div>

        <div class="lg:col-span-7 xl:col-span-7 relative min-h-[500px] sm:min-h-[560px]">
          <BrandGeometricArtwork class="absolute inset-0 lg:inset-y-2 lg:right-0 lg:left-[8%] animate-flow-fade-up animate-flow-delay-1 opacity-95" />

          <div class="relative z-10 h-full">
            <LandingHeroSpaceCard
              v-for="(card, i) in heroSpaceCards"
              :key="card.type"
              :card="card"
              class="absolute animate-flow-fade-up"
              :class="[
                i === 0 && 'top-[2%] left-0 sm:left-[2%]',
                i === 1 && 'top-[6%] right-0 sm:right-[0%]',
                i === 2 && 'bottom-[20%] left-[0%] sm:left-[4%]',
                i === 3 && 'bottom-[6%] right-0 sm:right-[2%]'
              ]"
              :style="{ animationDelay: `${0.15 + i * 0.1}s` }"
            />
          </div>
        </div>
      </div>

      <!-- Feature strip — museum caption row -->
      <div class="mt-20 sm:mt-28 pt-12 border-t border-flow-border/50 dark:border-flow-border-dark/50">
        <div class="flex flex-wrap justify-center lg:justify-between gap-x-10 gap-y-6">
          <div
            v-for="item in featureStrip"
            :key="item.label"
            class="flex items-center gap-3 text-flow-muted dark:text-flow-muted-dark"
          >
            <UIcon :name="item.icon" class="w-4 h-4 stroke-[1.25] shrink-0" />
            <span class="text-sm tracking-wide">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
