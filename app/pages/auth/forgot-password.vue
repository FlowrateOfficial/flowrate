<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { t } = useAppI18n()
const auth = useAuthStore()
const { forgotForm, loading, forgotSent, forgotSchema } = storeToRefs(auth)

useSeoMeta({ title: () => t('auth.forgot.title') })
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-2">
      <h1 class="font-display text-2xl text-flow-ink dark:text-flow-ink-dark">{{ t('auth.forgot.title') }}</h1>
      <p class="text-sm text-flow-muted dark:text-flow-muted-dark">
        {{ t('auth.forgot.remember') }}
        <NuxtLink to="/auth/login" class="text-charcoal dark:text-flow-ink-dark underline underline-offset-4">
          {{ t('common.signIn') }}
        </NuxtLink>
      </p>
    </header>

    <div v-if="forgotSent" class="rounded-flow border border-default bg-elevated/30 p-4 text-center space-y-2">
      <UIcon name="i-lucide-mail" class="mx-auto size-8 text-muted" />
      <h2 class="text-base font-semibold">{{ t('auth.forgot.checkEmailTitle') }}</h2>
      <p class="text-sm text-muted">{{ t('auth.forgot.checkEmailDescription') }}</p>
    </div>

    <UForm v-else :schema="forgotSchema" :state="forgotForm" class="space-y-5" @submit="auth.forgotPassword">
        <UFormField :label="t('auth.login.email')" name="email" required>
          <UInput v-model="forgotForm.email" type="email" :placeholder="t('auth.login.emailPlaceholder')" autocomplete="email" class="w-full" variant="outline" />
        </UFormField>

        <UButton
          type="submit"
          :label="t('auth.forgot.submit')"
          block
          :loading="loading"
          color="neutral"
          class="!bg-charcoal dark:!bg-flow-warm !text-flow-warm dark:!text-charcoal rounded-flow"
        />
      </UForm>
  </div>
</template>
