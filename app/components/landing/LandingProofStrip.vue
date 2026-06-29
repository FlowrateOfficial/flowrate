<script setup lang="ts">
const landing = useLandingStore()
const { proofItems } = storeToRefs(landing)
</script>

<template>
  <LandingSection tinted>
    <template #default>
      <div class="py-14 sm:py-16 border-y border-flow-border/50 dark:border-flow-border-dark/50">
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 landing-section-panel">
          <div
            v-for="(item, i) in proofItems"
            :key="item.label"
            class="text-center sm:text-left landing-stagger"
            :style="{ '--stagger': `${i * 0.08}s` }"
          >
            <p class="font-display text-3xl sm:text-4xl text-flow-ink dark:text-flow-ink-dark tabular-nums tracking-tight">
              {{ item.value }}
            </p>
            <p class="mt-2 text-sm text-flow-muted dark:text-flow-muted-dark leading-relaxed max-w-56 mx-auto sm:mx-0">
              {{ item.label }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </LandingSection>
</template>
