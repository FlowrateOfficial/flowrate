<script setup lang="ts">
// ANCHOR: FlowRate mark image from public assets
const LOGO_SRC = '/flowrate_logo.png'

const props = withDefaults(defineProps<{
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
    :width="props.size"
    :height="props.size"
    class="shrink-0 object-contain"
    :class="props.class"
  >
</template>
