<script setup lang="ts">
import { storeToRefs } from 'pinia'

const { t, formatCurrency } = useAppI18n()
const landing = useLandingStore()
const { demoScenes, demoActiveIndex } = storeToRefs(landing)

const scene = computed(() => demoScenes.value[demoActiveIndex.value]!)

const shapes: Array<'circle' | 'triangle' | 'semicircle' | 'square'> = [
  'circle',
  'triangle',
  'semicircle',
  'square'
]

const navIcons = [
  'i-lucide-layout-dashboard',
  'i-lucide-arrow-left-right',
  'i-lucide-pie-chart',
  'i-lucide-wallet',
  'i-lucide-settings'
]

function fmt(amount: number) {
  return formatCurrency(amount, scene.value.currency)
}
</script>

<template>
  <div class="landing-hero-visual" aria-hidden="true">
    <div class="landing-hero-visual-ambient" />

    <div class="landing-hero-window">
      <div class="landing-hero-window-chrome">
        <div class="flex items-center gap-1.5">
          <span class="landing-demo-dot bg-terracotta/70" />
          <span class="landing-demo-dot bg-sand" />
          <span class="landing-demo-dot bg-sage/60" />
        </div>
        <span class="text-[10px] font-medium tracking-[0.14em] uppercase text-flow-muted dark:text-flow-muted-dark">
          {{ t('common.appName') }}
        </span>
        <AppBetaBadge size="sm" />
      </div>

      <div class="landing-hero-window-body">
        <aside class="landing-hero-sidebar">
          <div class="landing-hero-sidebar-logo">
            <BrandFlowRateMark :size="18" />
          </div>
          <div class="landing-hero-sidebar-nav">
            <span
              v-for="icon in navIcons"
              :key="icon"
              class="landing-hero-sidebar-item"
              :class="icon === 'i-lucide-layout-dashboard' && 'is-active'"
            >
              <UIcon :name="icon" class="size-3.5" />
            </span>
          </div>
        </aside>

        <div class="landing-hero-main min-w-0">
          <Transition name="landing-scene" mode="out-in">
            <div :key="scene.type" class="space-y-3">
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-[10px] uppercase tracking-wide text-muted">
                    {{ t('dashboard.layout.currentSpace') }}
                  </p>
                  <p class="font-display text-base text-default truncate">
                    {{ scene.title }}
                  </p>
                </div>
                <span class="landing-demo-space-badge shrink-0">
                  <BrandSpaceShape :shape="scene.shape" :size="11" />
                  {{ scene.title }}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div
                  v-for="card in scene.statCards"
                  :key="card.key"
                  class="landing-hero-stat"
                >
                  <div class="flex items-center gap-1.5 mb-1.5">
                    <UIcon :name="card.icon" class="size-3 text-muted shrink-0" />
                    <span class="text-[10px] text-muted truncate">{{ card.title }}</span>
                  </div>
                  <p class="text-sm font-semibold tabular-nums text-default truncate">
                    {{ card.displayValue ?? (card.amount != null ? fmt(card.amount) : '—') }}
                  </p>
                  <p
                    v-if="card.change"
                    class="text-[10px] mt-0.5 tabular-nums truncate"
                    :class="card.changePositive ? 'text-success' : 'text-warning'"
                  >
                    {{ card.change }}
                  </p>
                </div>
              </div>

              <div class="landing-hero-panel">
                <p class="text-[10px] font-medium text-muted mb-2">
                  {{ t('dashboard.overview.recentTransactions') }}
                </p>
                <ul class="space-y-0 divide-y divide-default/60">
                  <li
                    v-for="tx in scene.transactions.slice(0, 3)"
                    :key="tx.id"
                    class="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                  >
                    <span class="text-xs text-default truncate">{{ tx.merchant ?? tx.description }}</span>
                    <span
                      class="text-xs font-semibold tabular-nums shrink-0"
                      :class="tx.amount > 0 ? 'text-success' : 'text-default'"
                    >
                      {{ tx.amount > 0 ? '+' : '−' }}{{ fmt(Math.abs(tx.amount)) }}
                    </span>
                  </li>
                </ul>
              </div>

              <div
                v-if="scene.subscription"
                class="landing-hero-alert"
              >
                <UIcon name="i-lucide-shield-alert" class="size-3.5 text-warning shrink-0" />
                <span class="text-[10px] text-default truncate">
                  {{ scene.subscription.name }} — {{ fmt(scene.subscription.amount) }}/mo
                </span>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <div class="landing-hero-space-tabs">
        <button
          v-for="(item, i) in demoScenes"
          :key="item.type"
          type="button"
          class="landing-hero-space-tab"
          :class="demoActiveIndex === i && 'is-active'"
          tabindex="-1"
        >
          <BrandSpaceShape :shape="shapes[i]!" :size="10" />
        </button>
      </div>
    </div>
  </div>
</template>
