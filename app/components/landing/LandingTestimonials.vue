<script setup lang="ts">
import type { Testimonial } from '~/stores/landing'

defineProps<{
  items: Testimonial[]
}>()

const { t } = useAppI18n()
</script>

<template>
  <section class="py-28 sm:py-36 border-t border-flow-border/40 dark:border-flow-border-dark/40">
    <UContainer>
      <div class="grid lg:grid-cols-12 gap-12 mb-20">
        <div class="lg:col-span-5">
          <p class="flow-section-label text-sand mb-6">04</p>
          <h2 class="text-display-section text-flow-ink dark:text-flow-ink-dark">
            {{ t('landing.testimonials.title') }}
          </h2>
        </div>
        <p class="lg:col-span-5 lg:col-start-8 text-lg text-flow-muted dark:text-flow-muted-dark self-end leading-relaxed">
          {{ t('landing.testimonials.description') }}
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-12 lg:gap-16">
        <blockquote
          v-for="item in items"
          :key="item.author"
          class="space-y-10"
        >
          <p class="font-display text-xl sm:text-2xl text-flow-ink dark:text-flow-ink-dark leading-[1.5]">
            "{{ item.quote }}"
          </p>
          <footer class="flex items-center gap-5">
            <div
              class="w-14 h-14 rounded-full bg-charcoal dark:bg-flow-secondary-dark flex items-center justify-center text-flow-warm dark:text-flow-muted-dark text-sm font-medium ring-1 ring-flow-border/50"
              aria-hidden="true"
            >
              {{ item.initials }}
            </div>
            <div>
              <cite class="not-italic text-sm font-medium text-flow-ink dark:text-flow-ink-dark tracking-wide">
                {{ item.author }}
              </cite>
              <p class="text-xs text-flow-muted dark:text-flow-muted-dark mt-1">
                {{ item.role }}
              </p>
            </div>
          </footer>
        </blockquote>
      </div>
    </UContainer>
  </section>
</template>
