<script setup lang="ts">
import type { Testimonial } from '~/stores/landing'

defineProps<{
  items: Testimonial[]
}>()

const { t } = useAppI18n()
</script>

<template>
  <section class="py-24 sm:py-32 border-t border-flow-border/60 dark:border-flow-border-dark/60">
    <UContainer>
      <div class="grid lg:grid-cols-12 gap-12 mb-16">
        <div class="lg:col-span-5">
          <p class="text-sm text-sand dark:text-sand mb-4">04</p>
          <h2 class="text-display-section text-flow-ink dark:text-flow-ink-dark">
            {{ t('landing.testimonials.title') }}
          </h2>
        </div>
        <p class="lg:col-span-5 lg:col-start-8 text-lg text-flow-muted dark:text-flow-muted-dark self-end">
          {{ t('landing.testimonials.description') }}
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-8 lg:gap-12">
        <blockquote
          v-for="item in items"
          :key="item.author"
          class="space-y-8"
        >
          <p class="font-display text-xl sm:text-2xl text-flow-ink dark:text-flow-ink-dark leading-relaxed italic">
            "{{ item.quote }}"
          </p>
          <footer class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-full bg-charcoal dark:bg-flow-secondary-dark flex items-center justify-center text-flow-warm dark:text-flow-muted-dark text-sm font-medium"
              aria-hidden="true"
            >
              {{ item.initials }}
            </div>
            <div>
              <cite class="not-italic text-sm font-medium text-flow-ink dark:text-flow-ink-dark">
                {{ item.author }}
              </cite>
              <p class="text-xs text-flow-muted dark:text-flow-muted-dark mt-0.5">
                {{ item.role }}
              </p>
            </div>
          </footer>
        </blockquote>
      </div>
    </UContainer>
  </section>
</template>
