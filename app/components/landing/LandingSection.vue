<script setup lang="ts">
defineProps<{
  id?: string
  index?: string
  labelClass?: string
  tinted?: boolean
}>()

const { target, visible } = useScrollReveal(0.08)
</script>

<template>
  <section
    :id="id"
    ref="target"
    class="landing-section"
    :class="[
      visible ? 'is-visible' : '',
      tinted ? 'landing-section-tinted' : ''
    ]"
  >
    <slot name="background" />
    <UContainer class="relative min-w-0 max-w-full overflow-x-clip">
      <slot
        :visible="visible"
        :index="index"
        :label-class="labelClass"
      />
    </UContainer>
  </section>
</template>
