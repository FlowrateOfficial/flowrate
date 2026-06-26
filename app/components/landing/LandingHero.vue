<script setup lang="ts">
import { storeToRefs } from 'pinia'

const { t } = useAppI18n()
const landing = useLandingStore()
const { heroSpaceCards } = storeToRefs(landing)
</script>

<template>
  <section class="relative overflow-hidden">
    <UContainer class="py-20 sm:py-28 lg:py-36">
      <div class="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        <!-- Editorial copy — asymmetrical left -->
        <div class="lg:col-span-5 xl:col-span-5 space-y-8 animate-flow-fade-up">
          <p class="text-sm tracking-wide text-sage dark:text-sage font-medium">
            {{ t('landing.heroTagline') }}
          </p>
          <h1 class="text-display-hero text-flow-ink dark:text-flow-ink-dark">
            {{ t('landing.heroTitle') }}
          </h1>
          <p class="font-display text-xl sm:text-2xl text-flow-muted dark:text-flow-muted-dark italic leading-relaxed">
            {{ t('landing.heroSubtitle') }}
          </p>
          <p class="text-lg text-flow-muted dark:text-flow-muted-dark max-w-md leading-relaxed">
            {{ t('landing.heroDescription') }}
          </p>
          <div class="flex flex-wrap gap-4 pt-2">
            <NuxtLink to="/auth/register" class="btn-primary-editorial">
              {{ t('common.getStartedFree') }}
              <UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
            </NuxtLink>
            <NuxtLink to="/#how-it-works" class="btn-secondary-editorial">
              {{ t('landing.seeHow') }}
            </NuxtLink>
          </div>
        </div>

        <!-- Artwork + floating space cards — asymmetrical right -->
        <div class="lg:col-span-7 xl:col-span-7 relative min-h-[480px] sm:min-h-[520px]">
          <BrandGeometricArtwork class="absolute inset-0 lg:inset-y-4 lg:right-0 lg:left-[10%] animate-flow-fade-up animate-flow-delay-1" />

          <div class="relative z-10 h-full">
            <LandingHeroSpaceCard
              v-for="(card, i) in heroSpaceCards"
              :key="card.type"
              :card="card"
              class="absolute animate-flow-fade-up"
              :class="[
                i === 0 && 'top-[4%] left-0 sm:left-[4%]',
                i === 1 && 'top-[8%] right-0 sm:right-[2%]',
                i === 2 && 'bottom-[18%] left-[2%] sm:left-[8%]',
                i === 3 && 'bottom-[8%] right-0 sm:right-[6%]'
              ]"
              :style="{ animationDelay: `${0.15 + i * 0.1}s` }"
            />
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
