<script setup lang="ts">
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'

const props = defineProps<{
  labels: string[]
  values: number[]
  currency?: string
}>()

const theme = useChartTheme()
const { formatAxis, formatTooltip } = useChartCurrency(computed(() => props.currency))

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.labels,
  datasets: [{
    data: props.values,
    borderColor: theme.isDark.value ? theme.textBright.value : '#2A2A2A',
    backgroundColor: theme.fillInk.value,
    fill: true,
    tension: 0.3,
    pointRadius: 3,
    pointBackgroundColor: theme.sage.value
  }]
}))

const options = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const value = ctx.parsed.y
          if (value == null) return ''
          return formatTooltip(value)
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: theme.text.value }
    },
    y: {
      grid: { color: theme.gridStrong.value },
      ticks: {
        color: theme.text.value,
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
