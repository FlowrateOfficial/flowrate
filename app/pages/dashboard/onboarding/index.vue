<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Welcome', middleware: 'auth' })

const route = useRoute()
const { t } = useAppI18n()
const onboarding = useOnboardingStore()
const { step, selected, spaceName, loading, options } = storeToRefs(onboarding)

onMounted(() => {
  if (route.query.plan === 'enterprise') {
    onboarding.selectType('COMPANY')
    onboarding.continueFromStep1()
  }
})

useSeoMeta({ title: () => `${t('dashboard.onboarding.welcome')} — ${t('common.appName')}` })
</script>

<template>
  <DashboardPageShell max-width="lg">
    <div class="text-center">
      <h1 class="text-2xl font-semibold sm:text-3xl">{{ t('dashboard.onboarding.title') }}</h1>
      <p class="mt-1 text-sm text-muted sm:text-base">{{ t('dashboard.onboarding.subtitle') }}</p>
    </div>

    <div v-if="step === 1" class="grid gap-3 sm:grid-cols-2">
      <UCard
        v-for="opt in options"
        :key="opt.type"
        class="cursor-pointer transition-all"
        :class="selected === opt.type ? 'ring-2 ring-primary bg-primary/5' : 'hover:ring-1 hover:ring-primary/30'"
        :ui="{ body: 'p-4' }"
        @click="onboarding.selectType(opt.type)"
      >
        <UIcon :name="opt.icon" class="mb-2 size-7 text-primary" />
        <p class="font-semibold">{{ opt.title }}</p>
        <p class="mt-1 text-sm text-muted">{{ opt.description }}</p>
      </UCard>
    </div>

    <UCard v-else-if="selected && selected !== 'INDEPENDENT'" :ui="{ body: 'p-4 sm:p-5' }">
      <UFormField :label="t('dashboard.onboarding.spaceNameLabel')">
        <UInput v-model="spaceName" :placeholder="onboarding.defaultName(selected)" class="w-full" />
      </UFormField>
    </UCard>

    <div class="flex justify-between gap-3">
      <UButton
        v-if="step > 1"
        :label="t('common.back')"
        variant="ghost"
        color="neutral"
        @click="onboarding.goBack"
      />
      <div v-else />
      <UButton
        v-if="step === 1"
        :label="t('common.continue')"
        :disabled="!selected"
        @click="onboarding.continueFromStep1"
      />
      <UButton
        v-else
        :label="t('dashboard.onboarding.getStarted')"
        :loading="loading"
        @click="onboarding.finish"
      />
    </div>
  </DashboardPageShell>
</template>
