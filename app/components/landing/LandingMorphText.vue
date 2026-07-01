<script setup lang="ts">
const props = withDefaults(defineProps<{
  phrases: string[]
  intervalMs?: number
  tag?: 'span' | 'p' | 'h1' | 'h2'
  activeIndex?: number | null
}>(), {
  intervalMs: 3400,
  tag: 'span',
  activeIndex: null
})

const phrasesRef = computed(() => props.phrases)
const { index, pick, stop } = useMorphCycle(phrasesRef, props.intervalMs)

const displayIndex = computed(() =>
  props.activeIndex != null ? props.activeIndex : index.value
)

const displayText = computed(() =>
  props.phrases[displayIndex.value] ?? props.phrases[0] ?? ''
)

watch(() => props.activeIndex, (val) => {
  if (val != null) {
    pick(val)
    stop()
  }
})
</script>

<template>
  <component
    :is="tag"
    class="landing-morph-text"
    aria-live="polite"
  >
    <Transition
      name="landing-morph"
      mode="out-in"
    >
      <span
        :key="displayText"
        class="landing-morph-text-inner"
      >
        {{ displayText }}
      </span>
    </Transition>
  </component>
</template>
