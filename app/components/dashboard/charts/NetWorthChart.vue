<script setup lang="ts">
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'

const props = defineProps<{
  labels: string[]
  values: number[]
}>()

const colorMode = useColorMode()

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.labels,
  datasets: [{
    data: props.values,
    borderColor: '#2A2A2A',
    backgroundColor: colorMode.value === 'dark' ? 'rgba(248, 246, 242, 0.08)' : 'rgba(42, 42, 42, 0.06)',
    fill: true,
    tension: 0.3,
    pointRadius: 3,
    pointBackgroundColor: '#7A8F7A'
  }]
}))

const options = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: colorMode.value === 'dark' ? '#A39E97' : '#67635E' }
    },
    y: {
      grid: { color: colorMode.value === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
      ticks: { color: colorMode.value === 'dark' ? '#A39E97' : '#67635E' }
    }
  }
}))
</script>

<template>
  <ClientOnly>
    <Line :data="chartData" :options="options" />
  </ClientOnly>
</template>
