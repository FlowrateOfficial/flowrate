<script setup lang="ts">
import type { LandingFeature } from '~/stores/landing'

defineProps<{
  items: LandingFeature[]
}>()

const { t } = useAppI18n()

const shapes: Array<'circle' | 'triangle' | 'semicircle' | 'square'> = ['circle', 'triangle', 'semicircle', 'square']
</script>

<template>
  <section id="spaces" class="py-24 sm:py-32">
    <UContainer>
      <div class="grid lg:grid-cols-12 gap-12 mb-20">
        <div class="lg:col-span-7">
          <p class="text-sm text-terracotta mb-4">02</p>
          <h2 class="text-display-section text-flow-ink dark:text-flow-ink-dark">
            {{ t('landing.spacesTitle') }}
          </h2>
        </div>
        <div class="lg:col-span-5 lg:flex lg:items-end">
          <p class="text-lg text-flow-muted dark:text-flow-muted-dark leading-relaxed">
            {{ t('landing.spacesDescription') }}
          </p>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-6 lg:gap-8">
        <article
          v-for="(item, i) in items"
          :key="item.title"
          class="editorial-card group"
          :class="i % 2 === 1 ? 'sm:mt-12' : ''"
        >
          <BrandSpaceShape :shape="shapes[i]!" :size="40" class="mb-8 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
          <h3 class="font-display text-2xl sm:text-3xl text-flow-ink dark:text-flow-ink-dark mb-4">
            {{ item.title }}
          </h3>
          <p class="text-flow-muted dark:text-flow-muted-dark leading-relaxed">
            {{ item.description }}
          </p>
        </article>
      </div>
    </UContainer>
  </section>
</template>
