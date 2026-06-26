<script setup lang="ts">
const props = defineProps<{
  data: number[]
  class?: string
}>()

const points = computed(() => {
  const d = props.data
  if (d.length < 2) return ''
  const w = 80
  const h = 24
  const min = Math.min(...d)
  const max = Math.max(...d)
  const range = max - min || 1
  return d.map((v, i) => {
    const x = (i / (d.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
})
</script>

<template>
  <svg
    :class="class"
    width="80"
    height="24"
    viewBox="0 0 80 24"
    fill="none"
    aria-hidden="true"
  >
    <polyline
      :points="points"
      class="stroke-sage"
      stroke-width="1"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </svg>
</template>
