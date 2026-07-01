<script setup lang="ts">
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'

const props = defineProps<{
  labels: string[]
  income: number[]
  spending: number[]
  currency?: string
}>()

const theme = useChartTheme()
const { formatAxis, formatTooltip } = useChartCurrency(computed(() => props.currency))

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.labels,
  datasets: [
    {
      label: 'Income',
      data: props.income,
      borderColor: theme.incomeLine.value.border,
      backgroundColor: theme.incomeLine.value.fill,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 3,
      borderWidth: 1.5
    },
    {
      label: 'Spending',
      data: props.spending,
      borderColor: theme.spendingLine.value.border,
      backgroundColor: theme.spendingLine.value.fill,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 3,
      borderWidth: 1.5
    }
  ]
}))

const options = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'bottom',
      align: 'start',
      labels: {
        color: theme.text.value,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        pointStyle: 'line',
        padding: 20,
        font: { family: 'Inter', size: 12 }
      }
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const value = ctx.parsed.y
          if (value == null) return ''
          return `${ctx.dataset.label}: ${formatTooltip(value)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: theme.text.value,
        maxTicksLimit: 7,
        font: { family: 'Inter', size: 11 }
      }
    },
    y: {
      border: { display: false },
      grid: { color: theme.grid.value },
      ticks: {
        color: theme.text.value,
        font: { family: 'Inter', size: 11 },
        callback: value => formatAxis(value)
      }
    }
  }
}))
</script>

<template>
  <ClientOnly>
    <Line
      :data="chartData"
      :options="options"
    />
  </ClientOnly>
</template>
