<script setup lang="ts">
// ANCHOR: Settings page — profile, phone verify, billing
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Settings', middleware: ['auth', 'billing-sync'], keepalive: true })

const route = useRoute()
const { t } = useAppI18n()
const appToast = useAppToast()
const billingStore = useBillingStore()
const userStore = useUserStore()
const spacesStore = useSpacesStore()
const { isMinor } = storeToRefs(spacesStore)
const {
  profileForm,
  verificationCode,
  showVerificationInput,
  phoneVerified,
  isSavingProfile,
  isVerifyingPhone,
  isResendingCode
} = storeToRefs(userStore)
const { settingsPending } = storeToRefs(billingStore)

const accountDeleteModalRef = ref<{ openModal: (email: string) => void } | null>(null)
const userPrefs = useUserPreferences()
const { pending: prefsPending, saving: prefsSaving } = userPrefs

const runtimeConfig = useRuntimeConfig()
const emailNotificationsEnabled = computed(
  () => Boolean(runtimeConfig.public.emailNotificationsConfigured)
)
const subscriptionCapMonthly = ref<number | null>(null)

const emailPriceAlerts = ref(true)
const weeklyDigest = ref(true)

useDashboardSeo('dashboard.settings.title')

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

await useAsyncData(
  billingDataKey,
  () => billingStore.loadSettings({ checkoutSessionId: checkoutSessionId.value }),
  { lazy: import.meta.client, dedupe: 'defer' }
)

useAsyncData('user-preferences', async () => {
  await userPrefs.load()
  if (userPrefs.prefs.value) {
    emailPriceAlerts.value = userPrefs.prefs.value.emailPriceAlerts !== false
    weeklyDigest.value = userPrefs.prefs.value.weeklyDigest !== false
    subscriptionCapMonthly.value = userPrefs.prefs.value.subscriptionCapMonthly ?? null
  }
}, { lazy: import.meta.client, dedupe: 'defer' })

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
  await billingStore.loadSettings({ checkoutSessionId: checkoutSessionId.value })
}

async function saveProfile() {
  try {
    const data = await userStore.saveProfileForm()
    if (!data) return
    if (data.verificationSent) {
      appToast.success(t('dashboard.settings.phoneCodeSent'))
    }
    if (data.verificationError) {
      appToast.warning(t('dashboard.settings.phoneVerificationFailed'), data.verificationError)
    }
    appToast.success(t('dashboard.settings.profileSaved'))
  } catch (err: unknown) {
    appToast.errorMessage(userStore.profileSaveErrorMessage(err))
  }
}

async function verifyPhone() {
  const ok = await userStore.verifyPhoneForm()
  if (ok) appToast.success(t('dashboard.settings.phoneVerified'))
  else appToast.errorMessage(t('dashboard.settings.phoneCodeInvalid'))
}

async function resendVerificationCode() {
  try {
    await userStore.resendPhoneForm()
    appToast.success(t('dashboard.settings.phoneCodeResent'))
  } catch (err: unknown) {
    appToast.errorMessage(userStore.profileSaveErrorMessage(err))
  }
}

async function savePreferences() {
  const patch: {
    subscriptionCapMonthly: number | null
    emailPriceAlerts?: boolean
    weeklyDigest?: boolean
  } = { subscriptionCapMonthly: subscriptionCapMonthly.value }

  if (emailNotificationsEnabled.value) {
    patch.emailPriceAlerts = emailPriceAlerts.value
    patch.weeklyDigest = weeklyDigest.value
  }

  await userPrefs.save(patch)
}
</script>

<template>
  <DashboardPageShell max-width="md">
    <DashboardPageHeader
      :title="t('dashboard.settings.title')"
      :description="t('dashboard.settings.subtitle')"
    />

    <UCard :ui="{ body: 'p-4 sm:p-5' }">
      <h2 class="mb-4 text-base font-semibold">
        {{ t('dashboard.settings.profile') }}
      </h2>

      <div class="space-y-4">
        <UFormField :label="t('dashboard.settings.fullName')">
          <UInput
            v-model="profileForm.name"
            :placeholder="t('dashboard.settings.namePlaceholder')"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="t('dashboard.settings.email')">
          <UInput
            v-model="profileForm.email"
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
            v-model="profileForm.phone"
            type="tel"
            autocomplete="tel"
            :placeholder="t('dashboard.settings.phonePlaceholder')"
            class="w-full"
          />
          <template #help>
            <span>{{ t('dashboard.settings.phoneHelp') }}</span>
            <span class="block mt-1 text-xs text-muted">{{ t('dashboard.settings.phoneFormatHint') }}</span>
            <span
              v-if="profileForm.phone"
              class="block mt-1"
            >
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
          v-if="profileForm.phone && !phoneVerified && showVerificationInput"
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
        <UButton
          :label="t('dashboard.settings.saveChanges')"
          :loading="isSavingProfile"
          @click="saveProfile"
        />
      </div>
    </UCard>

    <UCard
      v-if="!isMinor"
      :ui="{ body: 'p-4 sm:p-5' }"
    >
      <h2 class="mb-1 text-base font-semibold">
        {{ t('dashboard.settings.prefsTitle') }}
      </h2>
      <p class="mb-4 text-sm text-muted">
        {{ t('dashboard.settings.prefsSubtitle') }}
      </p>

      <div
        v-if="prefsPending"
        class="space-y-3"
      >
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <UAlert
          v-if="!emailNotificationsEnabled"
          color="neutral"
          variant="subtle"
          icon="i-lucide-mail"
          :title="t('dashboard.settings.emailNotificationsComingSoon')"
          :description="t('dashboard.settings.emailNotificationsComingSoonHelp')"
        />
        <template v-else>
          <UCheckbox
            v-model="emailPriceAlerts"
            :label="t('dashboard.settings.emailPriceAlerts')"
          />
          <UCheckbox
            v-model="weeklyDigest"
            :label="t('dashboard.settings.weeklyDigest')"
          />
        </template>
        <UFormField :label="t('dashboard.settings.subscriptionCap')">
          <UInput
            v-model.number="subscriptionCapMonthly"
            type="number"
            min="0"
            step="1"
            class="w-full max-w-xs"
          />
          <template #help>
            {{ t('dashboard.settings.subscriptionCapHelp') }}
          </template>
        </UFormField>
        <div class="flex justify-end">
          <UButton
            :label="t('dashboard.settings.saveChanges')"
            :loading="prefsSaving"
            @click="savePreferences"
          />
        </div>
      </div>
    </UCard>

    <DashboardFeedbackPanel />

    <UCard
      v-if="!isMinor"
      :ui="{ body: 'p-4 sm:p-5' }"
    >
      <h2 class="mb-4 text-base font-semibold">
        {{ t('dashboard.settings.stripeCustomerTitle') }}
      </h2>
      <ClientOnly>
        <DashboardStripeCustomerForm />
        <template #fallback>
          <USkeleton class="h-64 w-full rounded-xl" />
        </template>
      </ClientOnly>
    </UCard>

    <UCard
      v-if="!isMinor"
      :ui="{ body: 'p-4 sm:p-5' }"
    >
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-base font-semibold">
          {{ t('dashboard.settings.planBilling') }}
        </h2>
        <AppBetaBadge size="sm" />
      </div>

      <DashboardBillingPanel
        :ready="!settingsPending"
        @refreshed="refreshProfile"
      />
    </UCard>

    <UCard :ui="{ body: 'p-4 sm:p-5' }">
      <h2 class="mb-3 text-base font-semibold text-error">
        {{ t('dashboard.settings.dangerZone') }}
      </h2>
      <p class="text-sm text-muted mb-4">
        {{ t('dashboard.settings.deleteWarning') }}
      </p>
      <p class="text-xs text-muted mb-4">
        <NuxtLink
          to="/privacy"
          class="text-primary hover:underline"
        >{{ t('common.privacy') }}</NuxtLink>
      </p>
      <UButton
        :label="t('dashboard.settings.deleteAccount')"
        color="error"
        variant="subtle"
        icon="i-lucide-trash-2"
        @click="accountDeleteModalRef?.openModal(profileForm.email)"
      />
    </UCard>

    <DashboardAccountDeleteModal ref="accountDeleteModalRef" />
  </DashboardPageShell>
</template>
