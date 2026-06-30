<script setup lang="ts">
// ANCHOR: Vendor spend trend lines for company scorecard
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'

const props = defineProps<{
  trends: Array<{
    name: string
    points: Array<{ month: string, amount: number }>
  }>
  currency?: string
}>()

const theme = useChartTheme()
const { formatAxis, formatTooltip } = useChartCurrency(computed(() => props.currency))

const palette = ['#6366f1', '#22c55e', '#f59e0b']

const labels = computed(() => {
  const months = new Set<string>()
  for (const trend of props.trends) {
    for (const point of trend.points) months.add(point.month)
  }
  return [...months].sort()
})

const chartData = computed<ChartData<'line'>>(() => ({
  labels: labels.value.map(month => month.slice(5)),
  datasets: props.trends.map((trend, index) => ({
    label: trend.name,
    data: labels.value.map((month) => {
      const point = trend.points.find(p => p.month === month)
      return point?.amount ?? 0
    }),
    borderColor: palette[index % palette.length],
    backgroundColor: 'transparent',
    tension: 0.35,
    pointRadius: 2,
    pointHoverRadius: 4,
    borderWidth: 2
  }))
}))

const options = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: theme.text.value,
        boxWidth: 8,
        font: { family: 'Inter', size: 11 }
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
      ticks: { color: theme.text.value, font: { size: 10 } }
    },
    y: {
      grid: { color: theme.grid.value },
      border: { display: false },
      ticks: {
        color: theme.text.value,
        callback: value => formatAxis(Number(value)),
        font: { size: 10 }
      }
    }
  }
}))
</script>

<template>
  <div class="h-52 w-full sm:h-56">
    <Line :data="chartData" :options="options" />
  </div>
</template>
