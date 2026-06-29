<script setup lang="ts">
import type { DemoScene } from '~/stores/landing'

const props = defineProps<{
  scene: DemoScene
}>()

const { t, intlLocale, formatCurrency } = useAppI18n()

const currency = computed(() => props.scene.currency)
const previewTx = computed(() => props.scene.transactions.slice(0, 3))

function fmt(amount: number) {
  return formatCurrency(amount, currency.value)
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat(intlLocale.value, { month: 'short', day: 'numeric' }).format(new Date(dateStr))
}
</script>

<template>
  <div class="landing-demo-dashboard">
    <div class="landing-demo-stats">
      <DashboardStatsCard
        v-for="card in scene.statCards"
        :key="card.key"
        :title="card.title"
        :value="card.displayValue ?? (card.amount != null ? fmt(card.amount) : '—')"
        :change="card.change"
        :change-positive="card.changePositive"
        :icon="card.icon"
        class="landing-demo-stat-card"
      />
    </div>

    <div
      v-if="scene.subscription"
      class="landing-demo-saas-row"
    >
      <div class="landing-demo-saas-icon" aria-hidden="true">
        {{ scene.subscription.name.charAt(0) }}
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-xs font-medium text-default">{{ scene.subscription.name }}</span>
          <UBadge
            :label="t('dashboard.subscriptions.priceUp')"
            color="error"
            variant="subtle"
            size="xs"
          />
        </div>
        <p v-if="scene.subscription.nextCharge" class="text-[10px] text-muted mt-0.5">
          {{ t('dashboard.subscriptions.nextCharge', { date: formatDate(scene.subscription.nextCharge) }) }}
        </p>
      </div>
      <div class="text-right shrink-0">
        <p class="text-xs font-semibold tabular-nums text-default">
          {{ fmt(scene.subscription.amount) }}
        </p>
        <p class="text-[10px] text-muted">/mo</p>
      </div>
    </div>

    <div
      class="landing-demo-panels"
      :class="scene.saasChart && 'landing-demo-panels-split'"
    >
      <div class="landing-demo-panel">
        <p class="landing-demo-panel-title">
          {{ t('dashboard.overview.recentTransactions') }}
        </p>
        <ul class="landing-demo-tx-list">
          <li
            v-for="tx in previewTx"
            :key="tx.id"
            class="landing-demo-tx-row"
          >
            <div class="min-w-0 flex-1">
              <p class="text-xs font-medium text-default truncate">
                {{ tx.merchant ?? tx.description }}
              </p>
              <p class="text-[10px] text-muted mt-0.5">{{ formatDate(tx.date) }}</p>
            </div>
            <span
              class="text-xs font-semibold tabular-nums shrink-0"
              :class="tx.amount > 0 ? 'text-success' : 'text-default'"
            >
              {{ tx.amount > 0 ? '+' : '−' }}{{ fmt(Math.abs(tx.amount)) }}
            </span>
          </li>
        </ul>
      </div>

      <div v-if="scene.saasChart" class="landing-demo-panel landing-demo-panel-chart">
        <p class="landing-demo-panel-title">
          {{ t('dashboard.overview.saasShield') }}
        </p>
        <div class="landing-demo-chart-wrap">
          <DashboardChartsCategoryChart
            compact
            :labels="scene.saasChart.labels"
            :values="scene.saasChart.values"
            :center-value="scene.saasChart.centerValue"
            :center-label="t('dashboard.overview.saasIssues')"
            :currency="currency"
          />
        </div>
      </div>
    </div>
  </div>
</template>
