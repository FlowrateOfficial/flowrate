<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'auth' })

const route = useRoute()
const { t } = useAppI18n()
const auth = useAuthStore()
const { registerForm, loading, error, inviteInfo, registerSchema } = storeToRefs(auth)

const plan = computed(() => route.query.plan as string | undefined)
const inviteToken = computed(() => route.query.invite as string | undefined)

if (inviteToken.value) {
  auth.loadInvite(inviteToken.value)
}

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
    </header>

    <UAlert
      v-if="inviteInfo"
      :title="t('auth.register.inviteTitle', { spaceName: inviteInfo.spaceName })"
      :description="t('auth.register.inviteDescription', { role: inviteInfo.role })"
      color="neutral"
      variant="subtle"
      icon="i-lucide-mail"
    />

    <UAlert v-if="error" :description="error" color="error" variant="subtle" icon="i-lucide-alert-circle" />

    <UForm :schema="registerSchema" :state="registerForm" class="space-y-5" @submit="auth.register">
      <UFormField :label="t('auth.register.name')" name="name" required>
        <UInput v-model="registerForm.name" type="text" :placeholder="t('auth.register.namePlaceholder')" autocomplete="name" class="w-full" variant="outline" />
      </UFormField>

      <UFormField :label="t('auth.login.email')" name="email" required>
        <UInput v-model="registerForm.email" type="email" :placeholder="t('auth.login.emailPlaceholder')" autocomplete="email" class="w-full" variant="outline" />
      </UFormField>

      <UFormField :label="t('auth.login.password')" name="password" required>
        <UInput v-model="registerForm.password" type="password" :placeholder="t('auth.register.passwordPlaceholder')" autocomplete="new-password" class="w-full" variant="outline" />
      </UFormField>

      <UFormField :label="t('auth.register.confirmPassword')" name="confirmPassword" required>
        <UInput v-model="registerForm.confirmPassword" type="password" :placeholder="t('auth.login.passwordPlaceholder')" autocomplete="new-password" class="w-full" variant="outline" />
      </UFormField>

      <p class="text-xs text-flow-muted dark:text-flow-muted-dark leading-relaxed">
        {{ t('auth.register.termsPrefix') }}
        <NuxtLink to="/terms" class="underline underline-offset-2">{{ t('auth.register.termsOfService') }}</NuxtLink>
        {{ t('auth.register.termsAnd') }}
        <NuxtLink to="/privacy" class="underline underline-offset-2">{{ t('auth.register.privacyPolicy') }}</NuxtLink>.
      </p>

      <UButton
        type="submit"
        :label="t('auth.register.submit')"
        block
        :loading="loading"
        color="neutral"
        class="!bg-charcoal dark:!bg-flow-warm !text-flow-warm dark:!text-charcoal rounded-flow"
      />
    </UForm>

    <USeparator :label="t('common.or')" />

    <AuthSocialButtons />
  </div>
</template>
