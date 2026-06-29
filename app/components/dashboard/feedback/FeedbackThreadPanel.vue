<script setup lang="ts">
// ANCHOR: Single feedback thread — description + team replies
import type { FeedbackThread } from '~/types/feedback'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

const props = defineProps<{
  issueNumber: number
}>()

const { t, formatOptionalDate, formatDateTime, feedbackTypeLabel } = useAppI18n()
const appToast = useAppToast()
const { api } = useApi()

const { data, pending, error, refresh } = useAsyncData(
  () => `feedback-thread-${props.issueNumber}`,
  () => api<{ thread: FeedbackThread }>(
    apiRoutes.feedbackDetail(props.issueNumber),
    { noSpace: true }
  ),
  { watch: [() => props.issueNumber] }
)

const thread = computed(() => data.value?.thread)

const typeLabel = computed(() => feedbackTypeLabel(thread.value?.type ?? ''))

watch(error, (value) => {
  if (value) {
    appToast.error(t('dashboard.feedback.threadLoadFailed'), t('dashboard.feedback.tryAgain'))
  }
})
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="pending"
      class="space-y-3"
    >
      <USkeleton class="h-6 w-2/3" />
      <USkeleton class="h-24 w-full" />
      <USkeleton class="h-20 w-full" />
    </div>

    <div
      v-else-if="error"
      class="space-y-3 text-center py-6"
    >
      <p class="text-sm text-muted">
        {{ t('dashboard.feedback.threadLoadFailed') }}
      </p>
      <UButton
        :label="t('dashboard.feedback.retry')"
        color="neutral"
        variant="outline"
        size="sm"
        @click="refresh()"
      />
    </div>

    <template v-else-if="thread">
      <div class="flex flex-wrap items-center gap-2">
        <UBadge
          :color="thread.state === 'open' ? 'success' : 'neutral'"
          variant="subtle"
          :label="thread.state === 'open' ? t('dashboard.feedback.statusOpen') : t('dashboard.feedback.statusClosed')"
        />
        <UBadge
          color="neutral"
          variant="outline"
          :label="typeLabel"
        />
        <span class="text-xs text-muted">
          {{ t('dashboard.feedback.submittedOn', { date: formatOptionalDate(thread.submittedAt) }) }}
        </span>
      </div>

      <DashboardFeedbackLabelBadges
        v-if="thread.labels.length"
        :labels="thread.labels"
      />

      <div class="rounded-xl border border-default bg-elevated/40 p-4 space-y-2">
        <p class="text-sm font-medium">
          {{ t('dashboard.feedback.yourMessage') }}
        </p>
        <DashboardFeedbackMarkdown :content="thread.description || t('dashboard.feedback.noDescription')" />
      </div>

      <div
        v-if="thread.replies.length"
        class="space-y-3"
      >
        <p class="text-sm font-medium">
          {{ t('dashboard.feedback.teamReplies') }}
        </p>
        <div
          v-for="reply in thread.replies"
          :key="reply.id"
          class="rounded-xl border border-default bg-default p-4 space-y-3"
        >
          <div class="flex items-center gap-3">
            <UAvatar
              :src="reply.authorAvatar ?? undefined"
              :alt="reply.authorName"
              size="sm"
            />
            <div class="min-w-0">
              <p class="text-sm font-medium truncate">
                {{ reply.authorName }}
              </p>
              <p class="text-xs text-muted">
                {{ formatDateTime(reply.createdAt) }}
              </p>
            </div>
          </div>
          <DashboardFeedbackMarkdown :content="reply.body" />
        </div>
      </div>

      <p
        v-else
        class="text-sm text-muted text-center py-4"
      >
        {{ t('dashboard.feedback.noRepliesDescription') }}
      </p>
    </template>
  </div>
</template>
