<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Settings', middleware: ['auth', 'billing-sync'] })

const route = useRoute()
const { t } = useAppI18n()
const billingStore = useBillingStore()
const userStore = useUserStore()
const spacesStore = useSpacesStore()
const { isMinor } = storeToRefs(spacesStore)

useSeoMeta({ title: () => `${t('dashboard.settings.title')} — ${t('common.appName')}` })

const appToast = useAppToast()

const profile = reactive({
  name: '',
  email: '',
  phone: ''
})
const phoneVerified = ref(false)
const verificationCode = ref('')
const isVerifyingPhone = ref(false)
const isResendingCode = ref(false)
const showVerificationInput = ref(false)
const isSavingProfile = ref(false)

function applyProfileForm(data: NonNullable<Awaited<ReturnType<typeof userStore.fetchProfile>>>) {
  profile.name = data.name ?? ''
  profile.email = data.email
  profile.phone = data.phone ?? ''
  phoneVerified.value = data.phoneVerified
  showVerificationInput.value = Boolean(data.phone && !data.phoneVerified)
}

async function loadBillingProfile(checkoutSessionId?: string) {
  await billingStore.fetchPlans()
  const data = await userStore.fetchProfile({
    syncBilling: true,
    checkoutSessionId
  })
  if (!data) return null

  billingStore.applyBillingContext(data.billing, data.plan)

  if (data.plan !== 'FREE' && data.billing?.subscription?.priceId) {
    try {
      await billingStore.previewChange()
    } catch {
      // NOTE - Preview optional on load
    }
  }

  return data
}

const checkoutSessionId = computed(() =>
  route.query.upgraded === '1' && typeof route.query.session_id === 'string'
    ? route.query.session_id
    : undefined
)

const billingDataKey = computed(() =>
  checkoutSessionId.value
    ? `dashboard-settings-billing-${checkoutSessionId.value}`
    : 'dashboard-settings-billing'
)

const { data: billingProfile, pending: billingPending, refresh: refreshBilling } = await useAsyncData(
  billingDataKey,
  () => loadBillingProfile(checkoutSessionId.value)
)

if (billingProfile.value) {
  applyProfileForm(billingProfile.value)
}

watch(billingProfile, (data) => {
  if (data) applyProfileForm(data)
})

onMounted(async () => {
  if (route.query.upgraded === '1') {
    appToast.success(t('dashboard.settings.upgradeSuccess'))
    await navigateTo({ path: '/dashboard/settings' }, { replace: true })
  }
  if (route.query.canceled === '1') {
    appToast.neutral(t('dashboard.settings.upgradeCanceled'))
    await navigateTo({ path: '/dashboard/settings' }, { replace: true })
  }
})

async function refreshProfile() {
  await refreshBilling()
}

async function saveProfile() {
  isSavingProfile.value = true
  try {
    const data = await userStore.updateProfile({
      name: profile.name,
      phone: profile.phone.trim() || null
    })
    applyProfileForm(data)
    if (data.verificationSent) {
      appToast.success(t('dashboard.settings.phoneCodeSent'))
    }
    if (data.verificationError) {
      appToast.warning(
        t('dashboard.settings.phoneVerificationFailed'),
        data.verificationError
      )
    }
    appToast.success(t('dashboard.settings.profileSaved'))
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'data' in err
      && typeof (err as { data?: { message?: string } }).data?.message === 'string'
      ? (err as { data: { message: string } }).data.message
      : t('dashboard.settings.tryAgain')
    appToast.errorMessage(
      message.includes('already')
        ? t('dashboard.settings.phoneTaken')
        : message.includes('E.164') || message.includes('valid')
          ? t('dashboard.settings.phoneInvalid')
          : message
    )
  } finally {
    isSavingProfile.value = false
  }
}

async function verifyPhone() {
  if (!verificationCode.value.trim()) return
  isVerifyingPhone.value = true
  try {
    await userStore.verifyPhoneCode(verificationCode.value.trim())
    phoneVerified.value = true
    showVerificationInput.value = false
    verificationCode.value = ''
    appToast.success(t('dashboard.settings.phoneVerified'))
  } catch {
    appToast.errorMessage(t('dashboard.settings.phoneCodeInvalid'))
  } finally {
    isVerifyingPhone.value = false
  }
}

async function resendVerificationCode() {
  isResendingCode.value = true
  try {
    await userStore.resendPhoneCode()
    appToast.success(t('dashboard.settings.phoneCodeResent'))
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'data' in err
      && typeof (err as { data?: { message?: string } }).data?.message === 'string'
      ? (err as { data: { message: string } }).data.message
      : t('dashboard.settings.tryAgain')
    appToast.errorMessage(message)
  } finally {
    isResendingCode.value = false
  }
}

const deleteModalOpen = ref(false)
const deleteConfirmEmail = ref('')
const deleteConfirmPassword = ref('')
const deleteAcknowledged = ref(false)
const isDeletingAccount = ref(false)

function openDeleteModal() {
  deleteConfirmEmail.value = profile.email
  deleteConfirmPassword.value = ''
  deleteAcknowledged.value = false
  deleteModalOpen.value = true
}

async function confirmDeleteAccount() {
  if (!deleteAcknowledged.value) return
  isDeletingAccount.value = true
  try {
    await userStore.deleteAccount({
      confirmEmail: deleteConfirmEmail.value.trim(),
      password: deleteConfirmPassword.value.trim() || undefined
    })
    appToast.success(t('dashboard.settings.deleteSuccess'))
    deleteModalOpen.value = false
    await navigateTo('/', { replace: true })
  } catch (err: unknown) {
    appToast.errorFrom(err, 'dashboard.settings.deleteFailed')
  } finally {
    isDeletingAccount.value = false
  }
}
</script>

<template>
  <DashboardPageShell max-width="md">
    <DashboardPageHeader
      :title="t('dashboard.settings.title')"
      :description="t('dashboard.settings.subtitle')"
    />

    <UCard :ui="{ body: 'p-4 sm:p-5' }">
      <h2 class="mb-4 text-base font-semibold">{{ t('dashboard.settings.profile') }}</h2>

      <div class="space-y-4">
        <UFormField :label="t('dashboard.settings.fullName')">
          <UInput v-model="profile.name" :placeholder="t('dashboard.settings.namePlaceholder')" class="w-full" />
        </UFormField>

        <UFormField :label="t('dashboard.settings.email')">
          <UInput
            v-model="profile.email"
            type="email"
            class="w-full"
            disabled
            :ui="{ base: 'opacity-60 cursor-not-allowed' }"
          />
          <template #help>
            {{ t('dashboard.settings.emailHelp') }}
          </template>
        </UFormField>

        <UFormField :label="t('dashboard.settings.phone')">
          <UInput
            v-model="profile.phone"
            type="tel"
            autocomplete="tel"
            :placeholder="t('dashboard.settings.phonePlaceholder')"
            class="w-full"
          />
          <template #help>
            <span>{{ t('dashboard.settings.phoneHelp') }}</span>
            <span class="block mt-1 text-xs text-muted">{{ t('dashboard.settings.phoneFormatHint') }}</span>
            <span v-if="profile.phone" class="block mt-1">
              <UBadge
                v-if="phoneVerified"
                :label="t('dashboard.settings.phoneVerified')"
                color="success"
                variant="subtle"
                size="xs"
                icon="i-lucide-check"
              />
              <UBadge
                v-else
                :label="t('dashboard.settings.phoneUnverified')"
                color="neutral"
                variant="subtle"
                size="xs"
              />
            </span>
          </template>
        </UFormField>

        <div
          v-if="profile.phone && !phoneVerified && showVerificationInput"
          class="rounded-lg border border-default p-4 space-y-3 bg-elevated/30"
        >
          <p class="text-sm text-muted">
            {{ t('dashboard.settings.phoneUnverified') }}
          </p>
          <UFormField :label="t('dashboard.settings.phoneVerifyCode')">
            <UInput
              v-model="verificationCode"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="8"
              :placeholder="t('dashboard.settings.phoneVerifyCodePlaceholder')"
              class="w-full max-w-xs"
            />
          </UFormField>
          <div class="flex flex-wrap gap-2">
            <UButton
              :label="t('dashboard.settings.phoneVerify')"
              icon="i-lucide-shield-check"
              :loading="isVerifyingPhone"
              :disabled="!verificationCode.trim()"
              @click="verifyPhone"
            />
            <UButton
              :label="t('dashboard.settings.phoneResendCode')"
              color="neutral"
              variant="outline"
              :loading="isResendingCode"
              @click="resendVerificationCode"
            />
          </div>
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <UButton :label="t('dashboard.settings.saveChanges')" :loading="isSavingProfile" @click="saveProfile" />
      </div>
    </UCard>

    <UCard v-if="!isMinor" :ui="{ body: 'p-4 sm:p-5' }">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-base font-semibold">{{ t('dashboard.settings.planBilling') }}</h2>
        <AppBetaBadge size="sm" />
      </div>

      <DashboardBillingPanel
        :ready="!billingPending"
        @refreshed="refreshProfile"
      />
    </UCard>

    <UCard :ui="{ body: 'p-4 sm:p-5' }">
      <h2 class="mb-3 text-base font-semibold text-error">{{ t('dashboard.settings.dangerZone') }}</h2>
      <p class="text-sm text-muted mb-4">
        {{ t('dashboard.settings.deleteWarning') }}
      </p>
      <p class="text-xs text-muted mb-4">
        <NuxtLink to="/privacy" class="text-primary hover:underline">{{ t('common.privacy') }}</NuxtLink>
      </p>
      <UButton
        :label="t('dashboard.settings.deleteAccount')"
        color="error"
        variant="subtle"
        icon="i-lucide-trash-2"
        @click="openDeleteModal"
      />
    </UCard>

    <UModal v-model:open="deleteModalOpen" :title="t('dashboard.settings.deleteModalTitle')">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-muted">{{ t('dashboard.settings.deleteModalDescription') }}</p>

          <UFormField :label="t('dashboard.settings.deleteConfirmEmail')">
            <UInput
              v-model="deleteConfirmEmail"
              type="email"
              autocomplete="off"
              :placeholder="t('dashboard.settings.deleteConfirmEmailPlaceholder')"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('dashboard.settings.deleteConfirmPassword')">
            <UInput
              v-model="deleteConfirmPassword"
              type="password"
              autocomplete="current-password"
              :placeholder="t('dashboard.settings.deleteConfirmPasswordPlaceholder')"
              class="w-full"
            />
            <template #help>{{ t('dashboard.settings.deleteConfirmPasswordHelp') }}</template>
          </UFormField>

          <UCheckbox
            v-model="deleteAcknowledged"
            :label="t('dashboard.settings.deleteConfirmPhrase')"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            :label="t('dashboard.settings.deleteCancel')"
            color="neutral"
            variant="outline"
            @click="deleteModalOpen = false"
          />
          <UButton
            :label="t('dashboard.settings.deleteConfirmAction')"
            color="error"
            :loading="isDeletingAccount"
            :disabled="!deleteAcknowledged || !deleteConfirmEmail.trim()"
            @click="confirmDeleteAccount"
          />
        </div>
      </template>
    </UModal>
  </DashboardPageShell>
</template>
