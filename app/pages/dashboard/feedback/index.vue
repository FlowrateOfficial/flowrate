<script setup lang="ts">
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'
import { CSRF_COOKIE, CSRF_HEADER } from '#shared/security'
import { readCsrfTokenFromDocument } from '~/utils/csrf'

type FeedbackType = 'review' | 'feature' | 'bug'

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

const type = ref<FeedbackType>('review')
const rating = ref(5)
const title = ref('')
const message = ref('')
const includeContext = ref(true)
const submitting = ref(false)
const submitted = ref(false)

const typeOptions = computed(() => [
  { value: 'review' as const, label: t('dashboard.feedback.types.review'), icon: 'i-lucide-star' },
  { value: 'feature' as const, label: t('dashboard.feedback.types.feature'), icon: 'i-lucide-lightbulb' },
  { value: 'bug' as const, label: t('dashboard.feedback.types.bug'), icon: 'i-lucide-bug' }
])

const ratingOptions = [1, 2, 3, 4, 5]

const messageReady = computed((): boolean => {
  const built = editorRef.value?.buildMessage() ?? message.value
  return built.trim().length >= 10
})

const mediaErrorKeys: Record<string, string> = {
  unsupported: 'dashboard.feedback.mediaErrors.unsupported',
  tooLarge: 'dashboard.feedback.mediaErrors.tooLarge',
  tooMany: 'dashboard.feedback.mediaErrors.tooMany'
}

function onMediaError(code: string) {
  appToast.error(t(mediaErrorKeys[code] ?? 'dashboard.feedback.mediaErrors.generic'))
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
    await api(apiRoutes.feedback, {
      method: 'POST',
      body: form,
      noSpace: true,
      headers: token ? { [CSRF_HEADER]: token } : undefined
    })

    submitted.value = true
    title.value = ''
    message.value = ''
    rating.value = 5
    editorRef.value.clearAttachments()
    appToast.success(t('dashboard.feedback.successTitle'), t('dashboard.feedback.successDescription'))
  } catch (error) {
    appToast.errorFrom(error, 'dashboard.feedback.tryAgain', t('dashboard.feedback.failed'))
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  submitted.value = false
  message.value = ''
  editorRef.value?.clearAttachments()
}

useSeoMeta({ title: () => `${t('dashboard.feedback.pageTitle')} — ${t('common.appName')}` })
</script>

<template>
  <DashboardPageShell max-width="2xl">
    <DashboardPageHeader
      :title="t('dashboard.feedback.pageTitle')"
      :description="t('dashboard.feedback.pageDescription')"
    />

    <UAlert
      v-if="!enabled"
      color="warning"
      variant="subtle"
      icon="i-lucide-info"
      :title="t('dashboard.feedback.unavailableTitle')"
      :description="t('dashboard.feedback.unavailableDescription')"
    />

    <div
      v-else-if="submitted"
      class="rounded-xl border border-success/30 bg-success/5 p-5 space-y-3"
    >
      <p class="text-sm font-medium text-default">{{ t('dashboard.feedback.successTitle') }}</p>
      <p class="text-sm text-muted">{{ t('dashboard.feedback.successDescription') }}</p>
      <UButton
        :label="t('dashboard.feedback.sendAnother')"
        color="neutral"
        variant="outline"
        size="sm"
        @click="resetForm"
      />
    </div>

    <form v-else class="space-y-5" @submit.prevent="submit">
      <UCard :ui="{ body: 'p-4 sm:p-5 space-y-4' }">
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="option in typeOptions"
            :key="option.value"
            type="button"
            color="neutral"
            :variant="type === option.value ? 'soft' : 'outline'"
            size="sm"
            :icon="option.icon"
            :label="option.label"
            @click="type = option.value"
          />
        </div>

        <div v-if="type === 'review'" class="space-y-2">
          <p class="text-sm font-medium">{{ t('dashboard.feedback.rating') }}</p>
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
          <p class="text-sm font-medium">{{ t('dashboard.feedback.message') }}</p>
          <p class="text-xs text-muted">{{ t('dashboard.feedback.editorHelp') }}</p>
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
            :disabled="!title.trim() || !messageReady"
          />
        </div>
      </UCard>
    </form>
  </DashboardPageShell>
</template>
