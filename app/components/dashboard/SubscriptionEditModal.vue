<script setup lang="ts">
// ANCHOR: Manual subscription override — rename, hide, exclude
import type { SubscriptionItem } from '~/types/financial'

const props = defineProps<{
  subscription: SubscriptionItem | null
  open: boolean
  pending?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [patch: { displayName?: string | null, hidden?: boolean, excluded?: boolean }]
}>()

const { t } = useAppI18n()

const displayName = ref('')
const notSubscription = ref(false)
const hideFromList = ref(false)

watch(() => props.subscription, (sub) => {
  if (!sub) return
  displayName.value = sub.name
  notSubscription.value = false
  hideFromList.value = false
}, { immediate: true })

function close() {
  emit('update:open', false)
}

function save() {
  if (!props.subscription) return
  emit('save', {
    displayName: displayName.value.trim() || props.subscription.rawName || props.subscription.name,
    excluded: notSubscription.value || undefined,
    hidden: hideFromList.value || notSubscription.value || undefined
  })
}
</script>

<template>
  <UModal
    :open="open"
    :title="t('dashboard.subscriptions.editTitle')"
    :description="subscription?.rawName ?? subscription?.name"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField :label="t('dashboard.subscriptions.editName')">
          <UInput
            v-model="displayName"
            class="w-full"
          />
        </UFormField>

        <UCheckbox
          v-model="hideFromList"
          :label="t('dashboard.subscriptions.editHide')"
        />

        <UCheckbox
          v-model="notSubscription"
          :label="t('dashboard.subscriptions.editExclude')"
        />
        <p class="text-xs text-muted">
          {{ t('dashboard.subscriptions.editExcludeHelp') }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="t('common.cancel')"
          color="neutral"
          variant="ghost"
          @click="close"
        />
        <UButton
          :label="t('common.save')"
          :loading="pending"
          @click="save"
        />
      </div>
    </template>
  </UModal>
</template>
