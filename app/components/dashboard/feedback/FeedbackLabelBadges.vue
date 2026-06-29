<script setup lang="ts">
import type { FeedbackLabel } from '~/types/feedback'
import {
  feedbackUserLabelDisplay,
  isFeedbackUserLabel
} from '#shared/feedback'
import { feedbackLabelStyle } from '~/utils/feedback-labels'

const props = defineProps<{
  labels: Array<FeedbackLabel | string>
  size?: 'xs' | 'sm'
}>()

const { t } = useAppI18n()

const displayLabels = computed(() =>
  props.labels.map(normalizeLabel).filter(label => label.name.length > 0)
)

function normalizeLabel(label: FeedbackLabel | string): FeedbackLabel {
  if (typeof label === 'string') {
    if (isFeedbackUserLabel(label)) return feedbackUserLabelDisplay(label)
    return { name: label, color: '6b7280' }
  }
  if (!label.color && isFeedbackUserLabel(label.name)) {
    return feedbackUserLabelDisplay(label.name)
  }
  return { ...label, color: label.color ?? '6b7280' }
}

function labelText(label: FeedbackLabel) {
  const key = `dashboard.feedback.labels.${label.name}`
  const translated = t(key)
  return translated === key ? label.name : translated
}
</script>

<template>
  <div
    v-if="displayLabels.length"
    class="flex flex-wrap gap-1.5"
  >
    <span
      v-for="label in displayLabels"
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
