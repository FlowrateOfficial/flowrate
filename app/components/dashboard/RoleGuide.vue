<script setup lang="ts">
const { audience, guideTitle, guideDescription, guideSteps } = useDashboardGuide()

const audienceIcon: Record<string, string> = {
  child: 'i-lucide-piggy-bank',
  teen: 'i-lucide-wallet',
  parent: 'i-lucide-users',
  business: 'i-lucide-briefcase',
  general: 'i-lucide-compass'
}

const audienceColor: Record<string, 'primary' | 'info' | 'success' | 'warning' | 'neutral'> = {
  child: 'success',
  teen: 'primary',
  parent: 'info',
  business: 'warning',
  general: 'neutral'
}
</script>

<template>
  <UCard
    :ui="{ body: 'p-4 sm:p-5' }"
    class="border border-default/60"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div
        class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-elevated"
        aria-hidden="true"
      >
        <UIcon
          :name="audienceIcon[audience]"
          class="size-6 text-muted"
        />
      </div>
      <div class="min-w-0 flex-1 space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            :label="guideTitle"
            :color="audienceColor[audience]"
            variant="subtle"
            size="md"
          />
        </div>
        <p class="text-base leading-relaxed text-muted sm:text-lg">
          {{ guideDescription }}
        </p>
        <ol
          v-if="guideSteps.length"
          class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
        >
          <li
            v-for="(step, index) in guideSteps"
            :key="index"
            class="flex items-start gap-3 rounded-lg bg-elevated/60 px-3 py-3 text-sm leading-snug sm:text-base"
          >
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
            >
              {{ index + 1 }}
            </span>
            <span class="pt-0.5">{{ step }}</span>
          </li>
        </ol>
      </div>
    </div>
  </UCard>
</template>
