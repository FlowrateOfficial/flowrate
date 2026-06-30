<script setup lang="ts">
// ANCHOR: Account deletion modal
const { t } = useAppI18n()
const appToast = useAppToast()

const {
  open,
  confirmEmail,
  confirmPassword,
  emailCode,
  phoneCode,
  acknowledged,
  codesSent,
  isDeleting,
  isSendingCodes,
  isLoadingChallenge,
  challenge,
  canConfirm,
  openModal,
  sendVerificationCodes,
  confirmDelete
} = useAccountDelete()

defineExpose({ openModal })

async function handleConfirm() {
  try {
    const ok = await confirmDelete()
    if (!ok) return
    appToast.success(t('dashboard.settings.deleteSuccess'))
    await navigateTo('/', { replace: true })
  } catch (error) {
    appToast.errorFrom(error, 'dashboard.settings.deleteFailed')
  }
}
</script>

<template>
  <UModal v-model:open="open" :title="t('dashboard.settings.deleteModalTitle')">
    <template #body>
      <div class="space-y-4">
        <p v-if="isLoadingChallenge" class="text-sm text-muted">
          {{ t('dashboard.settings.deleteLoadingChallenge') }}
        </p>

        <template v-else-if="challenge">
          <p class="text-sm text-muted">
            <template v-if="challenge.requiresPassword">
              {{ t('dashboard.settings.deleteModalDescriptionPassword') }}
            </template>
            <template v-else>
              {{ t('dashboard.settings.deleteModalDescriptionOAuth') }}
            </template>
            <span v-if="challenge.hasVerifiedPhone">
              {{ t('dashboard.settings.deleteModalPhoneNote', { phone: challenge.phoneHint ?? '' }) }}
            </span>
          </p>

          <UFormField :label="t('dashboard.settings.deleteConfirmEmail')">
            <UInput
              v-model="confirmEmail"
              type="email"
              autocomplete="off"
              :placeholder="t('dashboard.settings.deleteConfirmEmailPlaceholder')"
              class="w-full"
            />
          </UFormField>

          <UButton
            v-if="!codesSent"
            :label="t('dashboard.settings.deleteSendCodes')"
            color="neutral"
            variant="outline"
            icon="i-lucide-mail"
            class="w-full"
            :loading="isSendingCodes"
            :disabled="!confirmEmail.trim()"
            @click="sendVerificationCodes"
          />

          <template v-if="codesSent">
            <UFormField :label="t('dashboard.settings.deleteEmailCode')">
              <UInput
                v-model="emailCode"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                :placeholder="t('dashboard.settings.deleteEmailCodePlaceholder')"
                class="w-full"
              />
              <template #help>{{ t('dashboard.settings.deleteEmailCodeHelp') }}</template>
            </UFormField>

            <UFormField
              v-if="challenge.hasVerifiedPhone"
              :label="t('dashboard.settings.deletePhoneCode')"
            >
              <UInput
                v-model="phoneCode"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                :placeholder="t('dashboard.settings.deletePhoneCodePlaceholder')"
                class="w-full"
              />
              <template #help>
                {{ t('dashboard.settings.deletePhoneCodeHelp', { phone: challenge.phoneHint ?? '' }) }}
              </template>
            </UFormField>

            <UFormField
              v-if="challenge.requiresPassword"
              :label="t('dashboard.settings.deleteConfirmPassword')"
            >
              <UInput
                v-model="confirmPassword"
                type="password"
                autocomplete="current-password"
                :placeholder="t('dashboard.settings.deleteConfirmPasswordPlaceholder')"
                class="w-full"
              />
            </UFormField>
          </template>

          <UCheckbox
            v-model="acknowledged"
            :label="t('dashboard.settings.deleteConfirmPhrase')"
          />
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          :label="t('dashboard.settings.deleteCancel')"
          color="neutral"
          variant="outline"
          @click="open = false"
        />
        <UButton
          :label="t('dashboard.settings.deleteConfirmAction')"
          color="error"
          :loading="isDeleting"
          :disabled="!canConfirm"
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>
