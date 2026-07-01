<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'

const props = defineProps<{
  labels: string[]
  values: number[]
  centerLabel?: string
  centerValue?: string
  currency?: string
  compact?: boolean
}>()

const theme = useChartTheme()
const { formatTooltip } = useChartCurrency(computed(() => props.currency))

const chartData = computed<ChartData<'doughnut'>>(() => ({
  labels: props.labels,
  datasets: [{
    data: props.values,
    backgroundColor: props.values.map((_, i) => theme.palette.value[i % theme.palette.value.length]),
    borderWidth: 2,
    borderColor: theme.surface.value,
    hoverOffset: 4
  }]
}))

const options = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: props.compact ? '68%' : '72%',
  plugins: {
    legend: {
      display: !props.compact,
      position: 'bottom',
      align: 'start',
      labels: {
        color: theme.text.value,
        boxWidth: 8,
        padding: 14,
        font: { family: 'Inter', size: 11 }
      }
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const value = ctx.parsed
          if (value == null) return ''
          return `${ctx.label}: ${formatTooltip(value)}`
        }
      }
    }
  }
}))
</script>

<template>
  <ClientOnly>
    <div
      class="relative h-full"
      :class="compact ? 'min-h-[100px]' : 'min-h-[200px]'"
    >
      <Doughnut
        :data="chartData"
        :options="options"
      />
      <div
        v-if="centerLabel"
        class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        :class="compact ? 'pb-0' : 'pb-10'"
      >
        <p
          class="font-light tabular-nums text-default"
          :class="compact ? 'text-lg' : 'text-2xl'"
        >
          {{ centerValue }}
        </p>
        <p class="text-[10px] text-muted mt-0.5 text-center px-2 leading-tight">
          {{ centerLabel }}
        </p>
      </div>
    </div>
  </ClientOnly>
</template>
