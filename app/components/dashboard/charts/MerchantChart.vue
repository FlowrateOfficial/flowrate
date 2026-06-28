<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'

const props = defineProps<{
  labels: string[]
  values: number[]
}>()

const colorMode = useColorMode()

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.labels,
  datasets: [{
    data: props.values,
    backgroundColor: '#7A8F7A',
    borderRadius: 6,
    maxBarThickness: 36
  }]
}))

const options = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { color: colorMode.value === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
      ticks: { color: colorMode.value === 'dark' ? '#A39E97' : '#67635E' }
    },
    y: {
      grid: { display: false },
      ticks: { color: colorMode.value === 'dark' ? '#A39E97' : '#67635E' }
    }
  }
}))
</script>

<template>
  <ClientOnly>
    <Bar :data="chartData" :options="options" />
  </ClientOnly>
</template>
