<script setup lang="ts">
import type { FeedbackSubmissionSummary } from '~/types/feedback'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

const emit = defineEmits<{
  select: [issueNumber: number]
}>()

const { t } = useAppI18n()
const { api } = useApi()

const { data, pending, refresh } = useAsyncData(
  'feedback-submissions',
  () => api<{ enabled: boolean, submissions: FeedbackSubmissionSummary[] }>(
    apiRoutes.feedback,
    { noSpace: true }
  ),
  { server: false }
)

defineExpose({ refresh })

const submissions = computed(() => data.value?.submissions ?? [])

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

function typeLabel(type: string) {
  if (type === 'review' || type === 'feature' || type === 'bug') {
    return t(`dashboard.feedback.types.${type}`)
  }
  return type
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="pending"
      class="space-y-2"
    >
      <USkeleton
        v-for="index in 3"
        :key="index"
        class="h-16 w-full rounded-xl"
      />
    </div>

    <p
      v-else-if="!submissions.length"
      class="text-sm text-muted text-center py-8"
    >
      {{ t('dashboard.feedback.noSubmissionsDescription') }}
    </p>

    <div
      v-else
      class="space-y-2"
    >
      <button
        v-for="item in submissions"
        :key="item.issueNumber"
        type="button"
        class="w-full rounded-xl border border-default bg-elevated/30 p-4 text-left transition-colors hover:bg-elevated/60"
        @click="emit('select', item.issueNumber)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 space-y-1">
            <p class="truncate text-sm font-medium">
              {{ item.title }}
            </p>
            <div class="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>{{ typeLabel(item.type) }}</span>
              <span>·</span>
              <span>{{ formatDate(item.submittedAt) }}</span>
            </div>
            <DashboardFeedbackLabelBadges
              v-if="item.labels.length"
              :labels="item.labels"
              size="xs"
              class="mt-1.5"
            />
          </div>
          <div class="flex shrink-0 flex-col items-end gap-1">
            <UBadge
              :color="item.state === 'open' ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
              :label="item.state === 'open' ? t('dashboard.feedback.statusOpen') : t('dashboard.feedback.statusClosed')"
            />
            <UBadge
              v-if="item.replyCount > 0"
              color="primary"
              variant="soft"
              size="sm"
              :label="t('dashboard.feedback.replyCount', { count: item.replyCount })"
            />
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
