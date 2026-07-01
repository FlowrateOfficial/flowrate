<script setup lang="ts">
const { t } = useAppI18n()
const config = useRuntimeConfig()

const enabled = computed(() => config.public.feedbackConfigured === true)
</script>

<template>
  <UCard
    id="feedback"
    :ui="{ body: 'p-4 sm:p-5' }"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <h2 class="text-base font-semibold">
          {{ t('dashboard.feedback.title') }}
        </h2>
        <p class="text-sm text-muted leading-relaxed">
          {{ t('dashboard.feedback.settingsTeaser') }}
        </p>
      </div>

      <UButton
        :to="enabled ? '/dashboard/feedback' : undefined"
        :disabled="!enabled"
        :label="t('dashboard.feedback.openPage')"
        icon="i-lucide-message-square-heart"
        color="primary"
        variant="soft"
        class="w-full sm:w-auto shrink-0"
      />
    </div>

    <UAlert
      v-if="!enabled"
      color="warning"
      variant="subtle"
      icon="i-lucide-info"
      :title="t('dashboard.feedback.unavailableTitle')"
      :description="t('dashboard.feedback.unavailableDescription')"
      class="mt-4"
    />
  </UCard>
</template>
