<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'auth' })

const { t } = useAppI18n()
const route = useRoute()
const auth = useAuthStore()
const { loginForm, loading, error, loginSchema } = storeToRefs(auth)

useSeoMeta({ title: () => t('auth.login.title') })

onMounted(() => {
  if (route.query.error === 'oauth') {
    auth.error = t('auth.login.errorOAuth')
  }
})
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-2">
      <h1 class="font-display text-2xl text-flow-ink dark:text-flow-ink-dark">{{ t('auth.login.title') }}</h1>
      <p class="text-sm text-flow-muted dark:text-flow-muted-dark">
        {{ t('auth.login.noAccount') }}
        <NuxtLink to="/auth/register" class="text-charcoal dark:text-flow-ink-dark underline underline-offset-4">
          {{ t('auth.login.createFree') }}
        </NuxtLink>
      </p>
    </header>

    <UAlert
      v-if="error"
      :description="error"
      color="error"
      variant="subtle"
      icon="i-lucide-alert-circle"
    />

    <UForm :schema="loginSchema" :state="loginForm" class="space-y-5" @submit="auth.login">
      <UFormField :label="t('auth.login.email')" name="email" required>
        <UInput
          v-model="loginForm.email"
          type="email"
          :placeholder="t('auth.login.emailPlaceholder')"
          autocomplete="email"
          class="w-full"
          variant="outline"
        />
      </UFormField>

      <UFormField :label="t('auth.login.password')" name="password" required>
        <UInput
          v-model="loginForm.password"
          type="password"
          :placeholder="t('auth.login.passwordPlaceholder')"
          autocomplete="current-password"
          class="w-full"
          variant="outline"
        />
      </UFormField>

      <div class="flex justify-end">
        <NuxtLink to="/auth/forgot-password" class="text-sm text-flow-muted dark:text-flow-muted-dark hover:text-flow-ink dark:hover:text-flow-ink-dark transition-colors">
          {{ t('auth.login.forgotPassword') }}
        </NuxtLink>
      </div>

      <UButton
        type="submit"
        :label="t('auth.login.submit')"
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
