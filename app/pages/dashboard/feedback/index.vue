<script setup lang="ts">
// ANCHOR: Feedback page — submit + list GitHub issues
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'
import { CSRF_COOKIE, CSRF_HEADER } from '#shared/security'
import { readCsrfTokenFromDocument } from '~/utils/csrf'

import type { FeedbackType } from '#shared/feedback'
import { FEEDBACK_TYPE_USER_LABEL } from '#shared/feedback'

definePageMeta({ layout: 'dashboard', title: 'Feedback', middleware: 'auth' })

const route = useRoute()
const { t } = useAppI18n()
const appToast = useAppToast()
const { api } = useApi()
const config = useRuntimeConfig()
const csrfCookie = useCookie<string | null>(CSRF_COOKIE)

const enabled = computed(() => config.public.feedbackConfigured === true)
const editorRef = useTemplateRef<{
  buildMessage: () => string
  getRegistry: () => import('~/lib/feedback/attachments').FeedbackAttachmentRegistry
  clearAttachments: () => void
}>('editorRef')
const submissionsRef = useTemplateRef<{ refresh: () => Promise<void> }>('submissionsRef')

const activeTab = ref('new')
const threadOpen = ref(false)
const selectedIssue = ref<number | null>(null)

const type = ref<FeedbackType>('review')
const rating = ref(5)
const title = ref('')
const message = ref('')
const includeContext = ref(true)
const submitting = ref(false)

const tabItems = computed(() => [
  { label: t('dashboard.feedback.tabNew'), value: 'new', icon: 'i-lucide-plus' },
  { label: t('dashboard.feedback.tabHistory'), value: 'history', icon: 'i-lucide-inbox' }
])

const typeOptions = computed(() => [
  {
    value: 'review' as const,
    label: t('dashboard.feedback.types.review'),
    description: t('dashboard.feedback.typeDescriptions.review'),
    icon: 'i-lucide-star',
    githubLabel: null
  },
  {
    value: 'feature' as const,
    label: t('dashboard.feedback.types.feature'),
    description: t('dashboard.feedback.typeDescriptions.feature'),
    icon: 'i-lucide-lightbulb',
    githubLabel: FEEDBACK_TYPE_USER_LABEL.feature
  },
  {
    value: 'bug' as const,
    label: t('dashboard.feedback.types.bug'),
    description: t('dashboard.feedback.typeDescriptions.bug'),
    icon: 'i-lucide-bug',
    githubLabel: FEEDBACK_TYPE_USER_LABEL.bug
  }
])

const ratingOptions = [1, 2, 3, 4, 5]

const messageReady = computed((): boolean => {
  const built = editorRef.value?.buildMessage() ?? message.value
  const attachments = editorRef.value?.getRegistry().list().length ?? 0
  return built.trim().length >= 10 || attachments > 0
})

const mediaErrorKeys: Record<string, string> = {
  unsupported: 'dashboard.feedback.mediaErrors.unsupported',
  tooLarge: 'dashboard.feedback.mediaErrors.tooLarge',
  tooMany: 'dashboard.feedback.mediaErrors.tooMany'
}

function onMediaError(code: string) {
  appToast.error(t(mediaErrorKeys[code] ?? 'dashboard.feedback.mediaErrors.generic'))
}

function openThread(issueNumber: number) {
  selectedIssue.value = issueNumber
  threadOpen.value = true
}

async function submit() {
  if (!enabled.value || submitting.value || !editorRef.value) return

  const builtMessage = editorRef.value.buildMessage()
  const registry = editorRef.value.getRegistry()
  const attachments = registry.list()

  submitting.value = true
  try {
    const payload = {
      type: type.value,
      title: title.value.trim(),
      message: builtMessage,
      rating: type.value === 'review' ? rating.value : undefined,
      includeContext: includeContext.value,
      path: route.path,
      attachmentIds: attachments.map(item => item.id)
    }

    const form = new FormData()
    form.append('payload', JSON.stringify(payload))
    for (const attachment of attachments) {
      form.append(`attachment_${attachment.id}`, attachment.file, attachment.file.name)
    }

    const token = csrfCookie.value ?? readCsrfTokenFromDocument()
    const result = await api<{ issueNumber: number }>(apiRoutes.feedback, {
      method: 'POST',
      body: form,
      noSpace: true,
      headers: token ? { [CSRF_HEADER]: token } : undefined
    })

    title.value = ''
    message.value = ''
    rating.value = 5
    editorRef.value.clearAttachments()
    await submissionsRef.value?.refresh()
    appToast.success(t('dashboard.feedback.successTitle'), t('dashboard.feedback.successDescription'))

    if (result.issueNumber) {
      activeTab.value = 'history'
      openThread(result.issueNumber)
    }
  } catch (error) {
    appToast.errorFrom(error, 'dashboard.feedback.tryAgain', t('dashboard.feedback.failed'))
  } finally {
    submitting.value = false
  }
}

useDashboardSeo('dashboard.feedback.pageTitle')
</script>

<template>
  <DashboardPageShell max-width="2xl">
    <DashboardPageHeader
      :title="t('dashboard.feedback.pageTitle')"
      :description="t('dashboard.feedback.pageDescription')"
    />

    <p
      v-if="!enabled"
      class="text-sm text-muted leading-relaxed"
    >
      {{ t('dashboard.feedback.unavailableDescription') }}
    </p>

    <template v-else>
      <UTabs
        v-model="activeTab"
        :items="tabItems"
        class="w-full"
      />

      <div
        v-if="activeTab === 'history'"
        class="space-y-4"
      >
        <UCard :ui="{ body: 'p-4 sm:p-5' }">
          <div class="mb-4 space-y-1">
            <h2 class="text-base font-semibold">
              {{ t('dashboard.feedback.historyTitle') }}
            </h2>
            <p class="text-sm text-muted">
              {{ t('dashboard.feedback.historyDescription') }}
            </p>
          </div>
          <DashboardFeedbackSubmissionsList
            ref="submissionsRef"
            @select="openThread"
          />
        </UCard>
      </div>

      <div
        v-else
        class="space-y-5"
      >
        <form
          class="space-y-5"
          @submit.prevent="submit"
        >
          <UCard :ui="{ body: 'p-4 sm:p-5 space-y-4' }">
            <div class="space-y-2">
              <p class="text-sm font-medium">
                {{ t('dashboard.feedback.category') }}
              </p>
              <p class="text-xs text-muted">
                {{ t('dashboard.feedback.categoryHelp') }}
              </p>
            </div>

            <div class="grid gap-2 sm:grid-cols-3">
              <button
                v-for="option in typeOptions"
                :key="option.value"
                type="button"
                class="rounded-xl border p-3 text-left transition-colors"
                :class="type === option.value
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'border-default bg-elevated/20 hover:bg-elevated/50'"
                @click="type = option.value"
              >
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="option.icon"
                    class="size-4 shrink-0"
                    :class="type === option.value ? 'text-primary' : 'text-muted'"
                  />
                  <span class="text-sm font-medium">{{ option.label }}</span>
                </div>
                <p class="mt-1 text-xs text-muted leading-relaxed">
                  {{ option.description }}
                </p>
                <p
                  v-if="option.githubLabel"
                  class="mt-2 text-[10px] font-mono uppercase tracking-wide text-muted"
                >
                  {{ option.githubLabel }}
                </p>
              </button>
            </div>

            <div
              v-if="type === 'review'"
              class="space-y-2"
            >
              <p class="text-sm font-medium">
                {{ t('dashboard.feedback.rating') }}
              </p>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="value in ratingOptions"
                  :key="value"
                  type="button"
                  class="rounded-md p-1.5 transition-colors"
                  :class="rating >= value ? 'text-warning' : 'text-muted hover:text-default'"
                  :aria-label="t('dashboard.feedback.ratingValue', { value })"
                  @click="rating = value"
                >
                  <UIcon
                    name="i-lucide-star"
                    class="size-5"
                    :class="rating >= value ? 'fill-current' : ''"
                  />
                </button>
              </div>
            </div>

            <UFormField :label="t('dashboard.feedback.subject')">
              <UInput
                v-model="title"
                :placeholder="t('dashboard.feedback.subjectPlaceholder')"
                maxlength="120"
                class="w-full"
              />
            </UFormField>
          </UCard>

          <UCard :ui="{ body: 'p-4 sm:p-5 space-y-3' }">
            <div class="space-y-1">
              <p class="text-sm font-medium">
                {{ t('dashboard.feedback.message') }}
              </p>
              <p class="text-xs text-muted">
                {{ t('dashboard.feedback.editorHelp') }}
              </p>
            </div>

            <ClientOnly>
              <DashboardFeedbackEditor
                ref="editorRef"
                v-model="message"
                @media-error="onMediaError"
              />
              <template #fallback>
                <USkeleton class="h-64 w-full rounded-xl" />
              </template>
            </ClientOnly>
          </UCard>

          <UCard :ui="{ body: 'p-4 sm:p-5 space-y-4' }">
            <UCheckbox
              v-model="includeContext"
              :label="t('dashboard.feedback.includeContext')"
              :description="t('dashboard.feedback.includeContextHelp')"
            />

            <p class="text-xs text-muted leading-relaxed">
              {{ t('dashboard.feedback.privacyNote') }}
            </p>

            <div class="flex justify-end">
              <UButton
                type="submit"
                :label="t('dashboard.feedback.submit')"
                icon="i-lucide-send"
                :loading="submitting"
                :disabled="title.trim().length < 3 || !messageReady"
              />
            </div>
          </UCard>
        </form>
      </div>

      <USlideover
        v-model:open="threadOpen"
        :title="t('dashboard.feedback.threadTitle')"
        :ui="{ content: 'max-w-lg w-full' }"
      >
        <template #body>
          <DashboardFeedbackThreadPanel
            v-if="selectedIssue"
            :issue-number="selectedIssue"
          />
        </template>
      </USlideover>
    </template>
  </DashboardPageShell>
</template>
