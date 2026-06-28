<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'

const props = defineProps<{
  labels: string[]
  values: number[]
  centerLabel?: string
  centerValue?: string
}>()

const colorMode = useColorMode()

const palette = ['#7A8F7A', '#C46F4A', '#D8C7AA', '#67635E', '#7FA26A', '#C59B4B', '#2A2A2A', '#A39E97']

const chartData = computed<ChartData<'doughnut'>>(() => ({
  labels: props.labels,
  datasets: [{
    data: props.values,
    backgroundColor: props.values.map((_, i) => palette[i % palette.length]),
    borderWidth: 2,
    borderColor: colorMode.value === 'dark' ? '#1E1D1B' : '#FCFBF8',
    hoverOffset: 4
  }]
}))

const options = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: {
      position: 'bottom',
      align: 'start',
      labels: {
        color: colorMode.value === 'dark' ? '#A39E97' : '#67635E',
        boxWidth: 8,
        padding: 14,
        font: { family: 'Inter', size: 11 }
      }
    }
  }
}))
</script>

<template>
  <ClientOnly>
    <div class="relative h-full min-h-[200px]">
      <Doughnut :data="chartData" :options="options" />
      <div
        v-if="centerLabel"
        class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-10"
      >
        <p class="text-2xl font-light tabular-nums text-flow-ink dark:text-flow-ink-dark">{{ centerValue }}</p>
        <p class="text-xs text-flow-muted dark:text-flow-muted-dark mt-1">{{ centerLabel }}</p>
      </div>
    </div>
  </ClientOnly>
</template>
