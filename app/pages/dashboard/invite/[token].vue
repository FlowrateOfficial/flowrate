<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const { t } = useAppI18n()
const { setBreadcrumbTail } = useBreadcrumbs()
const { getSession } = useNeonAuth()
const invitesStore = useInvitesStore()
const token = route.params.token as string

const session = await getSession()
const isLoggedIn = computed(() => Boolean(session?.user?.id))
const loginReturnUrl = computed(() => `/dashboard/invite/${token}`)

const {
  invite,
  error,
  accepting,
  accepted,
  loginEmail,
  verifyingPhone,
  completing,
  resendingCode
} = storeToRefs(invitesStore)

const verificationCode = ref('')
const password = ref('')
const confirmPassword = ref('')
const optionalEmail = ref('')
const displayName = ref('')
const formError = ref('')

await useAsyncData(() => `invite-${token}`, () => invitesStore.fetchInvite(token))

watch(
  () => invite.value?.spaceName,
  (name) => setBreadcrumbTail(name ?? null),
  { immediate: true }
)

watch(invite, (val) => {
  if (val?.displayName) displayName.value = val.displayName
  if (val?.email) optionalEmail.value = val.email
}, { immediate: true })

const showPhoneStep = computed(() => invite.value?.requiresPhoneVerification)
const showRegisterStep = computed(() =>
  Boolean(invite.value?.phone && invite.value?.phoneVerified)
)
const showEmailAccept = computed(() =>
  invite.value
  && !invite.value.requiresPhoneVerification
  && !showRegisterStep.value
)

async function verifyPhone() {
  formError.value = ''
  if (!verificationCode.value.trim()) return
  try {
    await invitesStore.verifyPhone(token, verificationCode.value.trim())
  } catch {
    formError.value = t('dashboard.invite.codeInvalid')
  }
}

async function resendCode() {
  formError.value = ''
  try {
    await invitesStore.resendPhoneCode(token)
  } catch {
    formError.value = t('dashboard.invite.resendFailed')
  }
}

async function completeRegistration() {
  formError.value = ''
  if (password.value.length < 8) {
    formError.value = t('dashboard.invite.passwordTooShort')
    return
  }
  if (password.value !== confirmPassword.value) {
    formError.value = t('dashboard.invite.passwordMismatch')
    return
  }
  try {
    await invitesStore.completeRegistration(token, {
      password: password.value,
      email: optionalEmail.value.trim() || undefined,
      name: displayName.value.trim() || undefined
    })
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'data' in e
      && typeof (e as { data?: { message?: string } }).data?.message === 'string'
      ? (e as { data: { message: string } }).data.message
      : t('dashboard.invite.completeFailed')
    formError.value = message
  }
}

async function accept() {
  formError.value = ''
  try {
    await invitesStore.acceptInvite(token)
  } catch {
    formError.value = t('dashboard.invite.acceptFailed')
  }
}
</script>

<template>
  <div class="px-6 py-16 max-w-lg mx-auto text-center space-y-6">
    <div v-if="error">
      <h1 class="font-display text-2xl">{{ t('dashboard.invite.expiredTitle') }}</h1>
      <p class="text-muted mt-2">{{ t('dashboard.invite.expiredDescription') }}</p>
      <UButton to="/dashboard" class="mt-6" :label="t('nav.overview')" />
    </div>

    <div v-else-if="accepted">
      <h1 class="font-display text-2xl">{{ t('dashboard.invite.acceptedTitle') }}</h1>
      <p v-if="loginEmail" class="text-sm text-muted mt-2">
        {{ t('dashboard.invite.loginHint', { email: loginEmail }) }}
      </p>
      <UButton to="/auth/login" class="mt-6" :label="t('common.signIn')" />
    </div>

    <div v-else-if="invite && showPhoneStep" class="text-left space-y-4">
      <h1 class="font-display text-2xl text-center">{{ t('dashboard.invite.phoneTitle', { space: invite.spaceName }) }}</h1>
      <p class="text-sm text-muted text-center">
        {{ t('dashboard.invite.phoneDescription', { phone: invite.phone ?? '' }) }}
      </p>
      <UAlert v-if="formError" :description="formError" color="error" variant="subtle" />
      <UFormField :label="t('dashboard.invite.verificationCode')">
        <UInput
          v-model="verificationCode"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="8"
          class="w-full"
        />
      </UFormField>
      <div class="flex flex-wrap gap-2 justify-center">
        <UButton
          :label="t('dashboard.invite.verifyPhone')"
          :loading="verifyingPhone"
          :disabled="!verificationCode.trim()"
          @click="verifyPhone"
        />
        <UButton
          :label="t('dashboard.invite.resendCode')"
          color="neutral"
          variant="outline"
          :loading="resendingCode"
          @click="resendCode"
        />
      </div>
    </div>

    <div v-else-if="invite && showRegisterStep" class="text-left space-y-4">
      <h1 class="font-display text-2xl text-center">{{ t('dashboard.invite.setupTitle', { space: invite.spaceName }) }}</h1>
      <p class="text-sm text-muted text-center">{{ t('dashboard.invite.setupDescription') }}</p>
      <UAlert v-if="formError" :description="formError" color="error" variant="subtle" />
      <UFormField :label="t('dashboard.invite.yourName')">
        <UInput v-model="displayName" class="w-full" />
      </UFormField>
      <UFormField :label="t('dashboard.invite.emailOptional')">
        <UInput v-model="optionalEmail" type="email" class="w-full" />
        <template #help>{{ t('dashboard.invite.emailOptionalHelp') }}</template>
      </UFormField>
      <UFormField :label="t('dashboard.invite.password')">
        <UInput v-model="password" type="password" autocomplete="new-password" class="w-full" />
      </UFormField>
      <UFormField :label="t('dashboard.invite.confirmPassword')">
        <UInput v-model="confirmPassword" type="password" autocomplete="new-password" class="w-full" />
      </UFormField>
      <UButton
        block
        :label="t('dashboard.invite.createAndJoin')"
        :loading="completing"
        @click="completeRegistration"
      />
    </div>

    <div v-else-if="invite && showEmailAccept">
      <h1 class="font-display text-2xl">{{ t('dashboard.invite.title', { space: invite.spaceName }) }}</h1>
      <p class="text-muted mt-2">{{ t('dashboard.invite.description', { role: invite.role }) }}</p>
      <UAlert v-if="formError" :description="formError" color="error" variant="subtle" class="mt-4" />
      <UButton
        v-if="isLoggedIn"
        :loading="accepting"
        class="mt-6"
        :label="t('dashboard.invite.accept')"
        @click="accept"
      />
      <UButton
        v-else
        class="mt-6"
        :label="t('dashboard.invite.signInToAccept')"
        :to="`/auth/login?redirect=${encodeURIComponent(loginReturnUrl)}`"
      />
    </div>
  </div>
</template>
