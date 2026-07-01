<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const { t } = useAppI18n()
const appToast = useAppToast()
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
const name = ref('')

await useAsyncData(() => `invite-${token}`, () => invitesStore.fetchInvite(token))

watch(
  () => invite.value?.spaceName,
  name => setBreadcrumbTail(name ?? null),
  { immediate: true }
)

watch(invite, (val) => {
  if (val?.name) name.value = val.name
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
  if (!verificationCode.value.trim()) return
  try {
    await invitesStore.verifyPhone(token, verificationCode.value.trim())
    appToast.success(t('dashboard.settings.phoneVerified'))
  } catch {
    appToast.errorMessage(t('dashboard.invite.codeInvalid'))
  }
}

async function resendCode() {
  try {
    await invitesStore.resendPhoneCode(token)
    appToast.success(t('dashboard.settings.phoneCodeResent'))
  } catch {
    appToast.errorMessage(t('dashboard.invite.resendFailed'))
  }
}

async function completeRegistration() {
  if (password.value.length < 8) {
    appToast.errorMessage(t('dashboard.invite.passwordTooShort'))
    return
  }
  if (password.value !== confirmPassword.value) {
    appToast.errorMessage(t('dashboard.invite.passwordMismatch'))
    return
  }
  try {
    await invitesStore.completeRegistration(token, {
      password: password.value,
      email: optionalEmail.value.trim() || undefined,
      name: name.value.trim() || undefined
    })
    appToast.success(t('dashboard.invite.acceptedTitle'))
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'data' in e
      && typeof (e as { data?: { message?: string } }).data?.message === 'string'
      ? (e as { data: { message: string } }).data.message
      : t('dashboard.invite.completeFailed')
    appToast.errorMessage(message)
  }
}

async function accept() {
  try {
    await invitesStore.acceptInvite(token)
    appToast.success(t('dashboard.invite.acceptedTitle'))
  } catch {
    appToast.errorMessage(t('dashboard.invite.acceptFailed'))
  }
}
</script>

<template>
  <DashboardPageShell max-width="md">
    <UCard
      v-if="error"
      :ui="{ body: 'p-6 sm:p-8 text-center' }"
    >
      <h1 class="text-xl font-semibold">
        {{ t('dashboard.invite.expiredTitle') }}
      </h1>
      <p class="mt-2 text-sm text-muted">
        {{ t('dashboard.invite.expiredDescription') }}
      </p>
      <UButton
        to="/dashboard"
        class="mt-4"
        :label="t('nav.overview')"
      />
    </UCard>

    <UCard
      v-else-if="accepted"
      :ui="{ body: 'p-6 sm:p-8 text-center' }"
    >
      <h1 class="text-xl font-semibold">
        {{ t('dashboard.invite.acceptedTitle') }}
      </h1>
      <p
        v-if="loginEmail"
        class="mt-2 text-sm text-muted"
      >
        {{ t('dashboard.invite.loginHint', { email: loginEmail }) }}
      </p>
      <UButton
        to="/auth/login"
        class="mt-4"
        :label="t('common.signIn')"
      />
    </UCard>

    <UCard
      v-else-if="invite && showPhoneStep"
      :ui="{ body: 'p-4 sm:p-5' }"
    >
      <h1 class="mb-1 text-center text-xl font-semibold">
        {{ t('dashboard.invite.phoneTitle', { space: invite.spaceName }) }}
      </h1>
      <p class="mb-4 text-center text-sm text-muted">
        {{ t('dashboard.invite.phoneDescription', { phone: invite.phone ?? '' }) }}
      </p>
      <div class="space-y-4">
        <UFormField :label="t('dashboard.invite.verificationCode')">
          <UInput
            v-model="verificationCode"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="8"
            class="w-full"
          />
        </UFormField>
        <div class="flex flex-wrap justify-center gap-2">
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
    </UCard>

    <UCard
      v-else-if="invite && showRegisterStep"
      :ui="{ body: 'p-4 sm:p-5' }"
    >
      <h1 class="mb-1 text-center text-xl font-semibold">
        {{ t('dashboard.invite.setupTitle', { space: invite.spaceName }) }}
      </h1>
      <p class="mb-4 text-center text-sm text-muted">
        {{ t('dashboard.invite.setupDescription') }}
      </p>
      <div class="space-y-4">
        <UFormField :label="t('dashboard.invite.yourName')">
          <UInput
            v-model="name"
            class="w-full"
          />
        </UFormField>
        <UFormField :label="t('dashboard.invite.emailOptional')">
          <UInput
            v-model="optionalEmail"
            type="email"
            class="w-full"
          />
          <template #help>
            {{ t('dashboard.invite.emailOptionalHelp') }}
          </template>
        </UFormField>
        <UFormField :label="t('dashboard.invite.password')">
          <UInput
            v-model="password"
            type="password"
            autocomplete="new-password"
            class="w-full"
          />
        </UFormField>
        <UFormField :label="t('dashboard.invite.confirmPassword')">
          <UInput
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            class="w-full"
          />
        </UFormField>
        <UButton
          block
          :label="t('dashboard.invite.createAndJoin')"
          :loading="completing"
          @click="completeRegistration"
        />
      </div>
    </UCard>

    <UCard
      v-else-if="invite && showEmailAccept"
      :ui="{ body: 'p-6 sm:p-8 text-center' }"
    >
      <h1 class="text-xl font-semibold">
        {{ t('dashboard.invite.title', { space: invite.spaceName }) }}
      </h1>
      <p class="mt-2 text-sm text-muted">
        {{ t('dashboard.invite.description', { role: invite.role }) }}
      </p>
      <UButton
        v-if="isLoggedIn"
        :loading="accepting"
        class="mt-4"
        :label="t('dashboard.invite.accept')"
        @click="accept"
      />
      <UButton
        v-else
        class="mt-4"
        :label="t('dashboard.invite.signInToAccept')"
        :to="`/auth/login?redirect=${encodeURIComponent(loginReturnUrl)}`"
      />
    </UCard>
  </DashboardPageShell>
</template>
