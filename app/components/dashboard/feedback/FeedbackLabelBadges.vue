<script setup lang="ts">
import type { FeedbackLabel } from '~/types/feedback'
import { feedbackLabelStyle } from '~/utils/feedback-labels'

defineProps<{
  labels: FeedbackLabel[]
  size?: 'xs' | 'sm'
}>()

const { t } = useAppI18n()

function labelText(label: FeedbackLabel) {
  const key = `dashboard.feedback.labels.${label.name}`
  const translated = t(key)
  return translated === key ? label.name : translated
}
</script>

<template>
  <div
    v-if="labels.length"
    class="flex flex-wrap gap-1.5"
  >
    <span
      v-for="label in labels"
      :key="label.name"
      class="inline-flex items-center rounded-full border px-2 py-0.5 font-medium leading-none"
      :class="size === 'xs' ? 'text-[10px]' : 'text-xs'"
      :style="feedbackLabelStyle(label)"
      :title="label.description ?? label.name"
    >
      {{ labelText(label) }}
    </span>
  </div>
</template>
