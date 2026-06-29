<script setup lang="ts">
import { resolveErrorMessage } from '~/utils/errors'

definePageMeta({ layout: 'auth' })

const route = useRoute()
const { t } = useAppI18n()
const appToast = useAppToast()
const { verifyEmailOtp, sendEmailVerificationOtp, getSession } = useNeonAuth()

const email = computed(() => {
  const value = route.query.email
  return typeof value === 'string' ? value : ''
})

const code = ref('')
const loading = ref(false)
const resending = ref(false)

useSeoMeta({ title: () => t('auth.verifyEmail.title') })

onMounted(async () => {
  const session = await getSession()
  const verified = (session?.user as { emailVerified?: boolean } | undefined)?.emailVerified
  if (verified) {
    await navigateTo('/dashboard')
  }
})

async function verifyEmail() {
  if (!email.value || !code.value.trim()) return

  loading.value = true
  try {
    const result = await verifyEmailOtp(email.value, code.value.trim())
    if (result.error) {
      appToast.errorMessage(resolveErrorMessage(result.error, t, 'auth.verifyEmail.errorInvalid'))
      return
    }

    appToast.success(t('auth.verifyEmail.success'))
    const plan = route.query.plan
    const billing = route.query.billing
    if (plan === 'pro' || plan === 'enterprise') {
      const billingStore = useBillingStore()
      await billingStore.fetchPlans()
      await billingStore.startCheckout(
        plan,
        billing === 'yearly' ? 'year' : 'month'
      )
      return
    }

    await navigateTo('/dashboard/onboarding')
  } catch (err) {
    appToast.errorFrom(err, 'auth.verifyEmail.errorGeneric')
  } finally {
    loading.value = false
  }
}

async function resendCode() {
  if (!email.value) return

  resending.value = true
  try {
    const result = await sendEmailVerificationOtp(email.value)
    if (result.error) {
      appToast.errorFrom(result.error, 'auth.verifyEmail.resendFailed')
      return
    }
    appToast.success(t('auth.verifyEmail.resendSuccess'))
  } catch (err) {
    appToast.errorFrom(err, 'auth.verifyEmail.resendFailed')
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-2">
      <h1 class="font-display text-2xl text-flow-ink dark:text-flow-ink-dark">
        {{ t('auth.verifyEmail.title') }}
      </h1>
      <p class="text-sm text-flow-muted dark:text-flow-muted-dark leading-relaxed">
        {{ t('auth.verifyEmail.description', { email: email || t('auth.verifyEmail.yourEmail') }) }}
      </p>
    </header>

    <UAlert
      v-if="!email"
      color="warning"
      variant="subtle"
      :title="t('auth.verifyEmail.missingEmail')"
    />

    <form v-else class="space-y-5" @submit.prevent="verifyEmail">
      <UFormField :label="t('auth.verifyEmail.code')" required>
        <UInput
          v-model="code"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="8"
          :placeholder="t('auth.verifyEmail.codePlaceholder')"
          class="w-full"
          variant="outline"
        />
      </UFormField>

      <UButton
        type="submit"
        :label="t('auth.verifyEmail.submit')"
        block
        :loading="loading"
        :disabled="!code.trim()"
        color="neutral"
        class="bg-charcoal! dark:bg-flow-ink-dark! text-flow-warm! dark:text-flow-bg-dark! rounded-flow"
      />

      <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
        <NuxtLink to="/auth/login" class="text-flow-muted dark:text-flow-muted-dark hover:text-flow-ink dark:hover:text-flow-ink-dark underline underline-offset-4">
          {{ t('auth.verifyEmail.backToSignIn') }}
        </NuxtLink>
        <UButton
          :label="t('auth.verifyEmail.resend')"
          color="neutral"
          variant="ghost"
          size="sm"
          :loading="resending"
          @click="resendCode"
        />
      </div>
    </form>
  </div>
</template>
