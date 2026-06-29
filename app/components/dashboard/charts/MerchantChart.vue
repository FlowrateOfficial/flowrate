<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'

const props = defineProps<{
  labels: string[]
  values: number[]
  currency?: string
}>()

const theme = useChartTheme()
const { formatAxis, formatTooltip } = useChartCurrency(computed(() => props.currency))

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.labels,
  datasets: [{
    data: props.values,
    backgroundColor: theme.sage.value,
    borderRadius: 6,
    maxBarThickness: 36
  }]
}))

const options = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const value = ctx.parsed.x
          if (value == null) return ''
          return formatTooltip(value)
        }
      }
    }
  },
  scales: {
    x: {
      grid: { color: theme.gridStrong.value },
      ticks: {
        color: theme.text.value,
        callback: (value) => formatAxis(value)
      }
    },
    y: {
      grid: { display: false },
      ticks: { color: theme.text.value }
    }
  }
}))
</script>

<template>
  <ClientOnly>
    <Bar :data="chartData" :options="options" />
  </ClientOnly>
</template>
