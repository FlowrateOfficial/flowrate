<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Settings', middleware: ['auth', 'billing-sync'] })

const route = useRoute()
const { t } = useAppI18n()
const billingStore = useBillingStore()
const userStore = useUserStore()
const spacesStore = useSpacesStore()
const { loading: billingLoading, proPlan } = storeToRefs(billingStore)
const { plan: userPlan } = storeToRefs(userStore)
const { isMinor } = storeToRefs(spacesStore)

useSeoMeta({ title: () => `${t('dashboard.settings.title')} — ${t('common.appName')}` })

const toast = useToast()

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
const profileSaved = ref(false)
const profileError = ref('')

onMounted(async () => {
  await billingStore.fetchPlans()

  if (route.query.upgraded === '1') {
    toast.add({ title: t('dashboard.settings.upgradeSuccess'), color: 'success' })
    await navigateTo({ path: '/dashboard/settings' }, { replace: true })
  }
  if (route.query.canceled === '1') {
    toast.add({ title: t('dashboard.settings.upgradeCanceled'), color: 'neutral' })
    await navigateTo({ path: '/dashboard/settings' }, { replace: true })
  }

  await loadProfile()
})

async function loadProfile() {
  const data = await userStore.fetchProfile(true)
  if (!data) return

  profile.name = data.name ?? ''
  profile.email = data.email
  profile.phone = data.phone ?? ''
  phoneVerified.value = data.phoneVerified
  showVerificationInput.value = Boolean(data.phone && !data.phoneVerified)
}

async function saveProfile() {
  isSavingProfile.value = true
  profileSaved.value = false
  profileError.value = ''
  try {
    const data = await userStore.updateProfile({
      name: profile.name,
      phone: profile.phone.trim() || null
    })
    profile.name = data.name ?? ''
    profile.email = data.email
    profile.phone = data.phone ?? ''
    phoneVerified.value = data.phoneVerified
    showVerificationInput.value = Boolean(data.phone && !data.phoneVerified)
    if (data.verificationSent) {
      toast.add({ title: t('dashboard.settings.phoneCodeSent'), color: 'success' })
    }
    if (data.verificationError) {
      profileError.value = t('dashboard.settings.phoneVerificationFailed')
      toast.add({ title: data.verificationError, color: 'warning' })
    }
    profileSaved.value = true
    setTimeout(() => { profileSaved.value = false }, 3000)
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'data' in err
      && typeof (err as { data?: { message?: string } }).data?.message === 'string'
      ? (err as { data: { message: string } }).data.message
      : t('dashboard.settings.tryAgain')
    profileError.value = message.includes('already')
      ? t('dashboard.settings.phoneTaken')
      : message.includes('E.164') || message.includes('valid')
        ? t('dashboard.settings.phoneInvalid')
        : message
  } finally {
    isSavingProfile.value = false
  }
}

async function verifyPhone() {
  if (!verificationCode.value.trim()) return
  isVerifyingPhone.value = true
  profileError.value = ''
  try {
    await userStore.verifyPhoneCode(verificationCode.value.trim())
    phoneVerified.value = true
    showVerificationInput.value = false
    verificationCode.value = ''
    toast.add({ title: t('dashboard.settings.phoneVerified'), color: 'success' })
  } catch {
    profileError.value = t('dashboard.settings.phoneCodeInvalid')
  } finally {
    isVerifyingPhone.value = false
  }
}

async function resendVerificationCode() {
  isResendingCode.value = true
  profileError.value = ''
  try {
    await userStore.resendPhoneCode()
    toast.add({ title: t('dashboard.settings.phoneCodeResent'), color: 'success' })
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'data' in err
      && typeof (err as { data?: { message?: string } }).data?.message === 'string'
      ? (err as { data: { message: string } }).data.message
      : t('dashboard.settings.tryAgain')
    profileError.value = message
  } finally {
    isResendingCode.value = false
  }
}

const planLabels = computed(() => ({
  FREE: { label: t('dashboard.settings.plans.FREE'), color: 'neutral' as const },
  PRO: { label: t('dashboard.settings.plans.PRO'), color: 'primary' as const },
  ENTERPRISE: { label: t('dashboard.settings.plans.ENTERPRISE'), color: 'success' as const }
}))
</script>

<template>
  <div class="px-6 sm:px-10 py-10 sm:py-14 space-y-8 max-w-2xl mx-auto">
    <DashboardPageHeader
      :title="t('dashboard.settings.title')"
      :description="t('dashboard.settings.subtitle')"
    />

    <UCard :ui="{ body: 'p-6 sm:p-8' }">
      <h2 class="font-display text-lg mb-6">{{ t('dashboard.settings.profile') }}</h2>

      <div class="space-y-4">
        <UAlert
          v-if="profileSaved"
          :description="t('dashboard.settings.profileSaved')"
          color="success"
          variant="subtle"
          icon="i-lucide-check-circle"
        />

        <UAlert
          v-if="profileError"
          :description="profileError"
          color="error"
          variant="subtle"
          icon="i-lucide-alert-circle"
        />

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

      <div class="flex justify-end mt-6">
        <UButton :label="t('dashboard.settings.saveChanges')" :loading="isSavingProfile" @click="saveProfile" />
      </div>
    </UCard>

    <UCard v-if="!isMinor" :ui="{ body: 'p-6 sm:p-8' }">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-display text-lg">{{ t('dashboard.settings.planBilling') }}</h2>
        <UBadge
          :label="planLabels[userPlan]?.label ?? t('dashboard.settings.plans.FREE')"
          :color="planLabels[userPlan]?.color ?? 'neutral'"
          variant="subtle"
        />
      </div>

      <div v-if="userPlan === 'FREE'" class="space-y-4">
        <p class="text-sm text-muted">
          {{ t('dashboard.settings.upgradeDescription') }}
        </p>
        <UButton
          :label="proPlan ? t('dashboard.settings.upgradeCtaDynamic', { price: proPlan.formattedPrice }) : t('dashboard.settings.upgradeCta')"
          icon="i-lucide-sparkles"
          :loading="billingLoading"
          @click="billingStore.startCheckout('pro')"
        />
      </div>

      <div v-else class="space-y-4">
        <p class="text-sm text-muted">
          {{ t('dashboard.settings.manageDescription') }}
        </p>
        <UButton
          :label="t('dashboard.settings.billingPortal')"
          icon="i-lucide-external-link"
          color="neutral"
          variant="outline"
          :loading="billingLoading"
          @click="billingStore.openPortal()"
        />
      </div>
    </UCard>

    <UCard v-if="!isMinor" :ui="{ body: 'p-6 sm:p-8' }">
      <h2 class="font-display text-lg mb-4 text-error">{{ t('dashboard.settings.dangerZone') }}</h2>
      <p class="text-sm text-muted mb-4">
        {{ t('dashboard.settings.deleteWarning') }}
      </p>
      <UButton
        :label="t('dashboard.settings.deleteAccount')"
        color="error"
        variant="subtle"
        icon="i-lucide-trash-2"
      />
    </UCard>
  </div>
</template>
