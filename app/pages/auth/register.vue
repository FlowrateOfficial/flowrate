<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const route = useRoute()
const { t } = useAppI18n()
const auth = useAuthStore()
const billingStore = useBillingStore()
const { registerForm, loading, inviteInfo, registerSchema, selectedPlan } = storeToRefs(auth)

const plan = computed(() => route.query.plan as string | undefined)
const billingCadence = computed(() => route.query.billing === 'yearly' ? 'yearly' : 'monthly')
const inviteToken = computed(() => route.query.invite as string | undefined)

if (inviteToken.value) {
  auth.loadInvite(inviteToken.value)
}

onMounted(async () => {
  if (plan.value === 'pro' || plan.value === 'enterprise') {
    selectedPlan.value = plan.value
  }
  await billingStore.fetchPlans()
  billingStore.pricingCadence = billingCadence.value
})

useSeoMeta({ title: () => t('auth.register.title') })
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-2">
      <h1 class="font-display text-2xl text-flow-ink dark:text-flow-ink-dark">{{ t('auth.register.title') }}</h1>
      <p class="text-sm text-flow-muted dark:text-flow-muted-dark">
        {{ t('auth.register.hasAccount') }}
        <NuxtLink to="/auth/login" class="text-charcoal dark:text-flow-ink-dark underline underline-offset-4">
          {{ t('common.signIn') }}
        </NuxtLink>
      </p>
      <UBadge
        v-if="plan === 'pro'"
        :label="t('auth.register.proBadge')"
        color="neutral"
        variant="subtle"
        size="sm"
        class="mt-1"
      />
      <UBadge
        v-if="plan === 'enterprise'"
        :label="t('auth.register.enterpriseBadge')"
        color="neutral"
        variant="subtle"
        size="sm"
        class="mt-1"
      />
    </header>

    <div v-if="!inviteInfo" class="space-y-3">
      <p class="text-sm font-medium text-flow-ink dark:text-flow-ink-dark">{{ t('auth.register.choosePlan') }}</p>
      <div class="grid gap-2 sm:grid-cols-3">
        <button
          v-for="option in [
            { id: 'free', title: t('auth.register.planFree'), description: t('auth.register.planFreeDescription') },
            { id: 'pro', title: t('auth.register.planPro'), description: t('auth.register.planProDescription') },
            { id: 'enterprise', title: t('auth.register.planEnterprise'), description: t('auth.register.planEnterpriseDescription') }
          ]"
          :key="option.id"
          type="button"
          class="rounded-flow border p-3 text-left transition-colors"
          :class="selectedPlan === option.id
            ? 'border-charcoal dark:border-flow-ink-dark/40 bg-flow-secondary/50 dark:bg-flow-elevated-dark/60'
            : 'border-flow-border/60 dark:border-flow-border-dark/60 hover:border-charcoal/40 dark:hover:border-flow-border-dark'"
          @click="selectedPlan = option.id as 'free' | 'pro' | 'enterprise'"
        >
          <p class="text-sm font-medium text-flow-ink dark:text-flow-ink-dark">{{ option.title }}</p>
          <p class="text-xs text-flow-muted dark:text-flow-muted-dark mt-1 leading-relaxed">{{ option.description }}</p>
        </button>
      </div>
      <div
        v-if="selectedPlan === 'pro' || selectedPlan === 'enterprise'"
        class="inline-flex border border-flow-border dark:border-flow-border-dark rounded-flow p-1"
      >
        <button
          type="button"
          class="px-3 py-1.5 text-xs rounded-[0.4rem]"
          :class="billingStore.pricingCadence === 'monthly' ? 'btn-segment-active' : 'text-flow-muted dark:text-flow-muted-dark'"
          @click="billingStore.pricingCadence = 'monthly'"
        >
          {{ t('auth.register.billingMonthly') }}
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-xs rounded-[0.4rem]"
          :class="billingStore.pricingCadence === 'yearly' ? 'btn-segment-active' : 'text-flow-muted dark:text-flow-muted-dark'"
          @click="billingStore.pricingCadence = 'yearly'"
        >
          {{ t('auth.register.billingYearly') }}
        </button>
      </div>
    </div>

    <UAlert
      v-if="inviteInfo"
      :title="t('auth.register.inviteTitle', { spaceName: inviteInfo.spaceName })"
      :description="t('auth.register.inviteDescription', { role: inviteInfo.role })"
      color="neutral"
      variant="subtle"
      icon="i-lucide-mail"
    />

    <UForm :schema="registerSchema" :state="registerForm" class="space-y-5" @submit="auth.register">
      <UFormField :label="t('auth.register.name')" name="name" required>
        <UInput v-model="registerForm.name" type="text" :placeholder="t('auth.register.namePlaceholder')" autocomplete="name" class="w-full" variant="outline" />
      </UFormField>

      <UFormField :label="t('auth.login.email')" name="email" required>
        <UInput v-model="registerForm.email" type="email" :placeholder="t('auth.login.emailPlaceholder')" autocomplete="email" class="w-full" variant="outline" />
        <template #help>
          <span class="text-xs text-flow-muted dark:text-flow-muted-dark">{{ t('auth.register.verifyEmailHint') }}</span>
        </template>
      </UFormField>

      <UFormField :label="t('auth.login.password')" name="password" required>
        <UInput v-model="registerForm.password" type="password" :placeholder="t('auth.register.passwordPlaceholder')" autocomplete="new-password" class="w-full" variant="outline" />
      </UFormField>

      <UFormField :label="t('auth.register.confirmPassword')" name="confirmPassword" required>
        <UInput v-model="registerForm.confirmPassword" type="password" :placeholder="t('auth.login.passwordPlaceholder')" autocomplete="new-password" class="w-full" variant="outline" />
      </UFormField>

      <UFormField name="agreedToTerms" required>
        <UCheckbox v-model="registerForm.agreedToTerms">
          <template #label>
            <span class="text-xs text-flow-muted dark:text-flow-muted-dark leading-relaxed">
              {{ t('auth.register.termsCheckboxPrefix') }}
              <NuxtLink to="/terms" target="_blank" class="underline underline-offset-2 hover:text-flow-ink dark:hover:text-flow-ink-dark">
                {{ t('auth.register.termsOfService') }}
              </NuxtLink>
              {{ t('auth.register.termsAnd') }}
              <NuxtLink to="/privacy" target="_blank" class="underline underline-offset-2 hover:text-flow-ink dark:hover:text-flow-ink-dark">
                {{ t('auth.register.privacyPolicy') }}
              </NuxtLink>.
            </span>
          </template>
        </UCheckbox>
      </UFormField>

      <UButton
        type="submit"
        :label="t('auth.register.submit')"
        block
        :loading="loading"
        color="neutral"
        class="bg-charcoal! dark:bg-flow-ink-dark! text-flow-warm! dark:text-flow-bg-dark! rounded-flow"
      />
    </UForm>

    <USeparator :label="t('common.or')" />

    <AuthSocialButtons />

    <p class="text-xs text-flow-muted dark:text-flow-muted-dark leading-relaxed text-center">
      {{ t('auth.register.termsPrefix') }}
      <NuxtLink to="/terms" target="_blank" class="underline underline-offset-2">{{ t('auth.register.termsOfService') }}</NuxtLink>
      {{ t('auth.register.termsAnd') }}
      <NuxtLink to="/privacy" target="_blank" class="underline underline-offset-2">{{ t('auth.register.privacyPolicy') }}</NuxtLink>.
    </p>
  </div>
</template>
