<script setup lang="ts">
// NOTE - ANCHOR: App mark — served from /public/flowrate_logo.png
const LOGO_SRC = '/flowrate_logo.png'

withDefaults(defineProps<{
  size?: number | string
  class?: string
}>(), {
  size: 32
})
</script>

<template>
  <img
    :src="LOGO_SRC"
    alt=""
    :width="size"
    :height="size"
    class="shrink-0 object-contain"
    :class="class"
  >
</template>
