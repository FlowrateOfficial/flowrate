<script setup lang="ts">
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'

const props = defineProps<{
  labels: string[]
  income: number[]
  spending: number[]
}>()

const colorMode = useColorMode()

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.labels,
  datasets: [
    {
      label: 'Income',
      data: props.income,
      borderColor: '#7A8F7A',
      backgroundColor: 'rgba(122, 143, 122, 0.05)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 3,
      borderWidth: 1.5
    },
    {
      label: 'Spending',
      data: props.spending,
      borderColor: '#C46F4A',
      backgroundColor: 'rgba(196, 111, 74, 0.05)',
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
        color: colorMode.value === 'dark' ? '#A39E97' : '#67635E',
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        pointStyle: 'line',
        padding: 20,
        font: { family: 'Inter', size: 12 }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: colorMode.value === 'dark' ? '#A39E97' : '#67635E',
        maxTicksLimit: 7,
        font: { family: 'Inter', size: 11 }
      }
    },
    y: {
      border: { display: false },
      grid: { color: colorMode.value === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(25,25,25,0.05)' },
      ticks: {
        color: colorMode.value === 'dark' ? '#A39E97' : '#67635E',
        font: { family: 'Inter', size: 11 }
      }
    }
  }
}))
</script>

<template>
  <ClientOnly>
    <Line :data="chartData" :options="options" />
  </ClientOnly>
</template>
