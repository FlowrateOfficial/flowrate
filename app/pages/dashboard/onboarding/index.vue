<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Welcome', middleware: 'auth' })

const { t } = useAppI18n()
const onboarding = useOnboardingStore()
const { step, selected, spaceName, loading, options } = storeToRefs(onboarding)

useSeoMeta({ title: () => `${t('dashboard.onboarding.welcome')} — ${t('common.appName')}` })
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto py-16 space-y-8">
    <div class="text-center">
      <h1 class="text-3xl font-bold">{{ t('dashboard.onboarding.title') }}</h1>
      <p class="text-muted mt-2">{{ t('dashboard.onboarding.subtitle') }}</p>
    </div>

    <div v-if="step === 1" class="grid sm:grid-cols-2 gap-4">
      <UCard
        v-for="opt in options"
        :key="opt.type"
        class="cursor-pointer transition-all"
        :class="selected === opt.type ? 'ring-2 ring-primary bg-primary/5' : 'hover:ring-1 hover:ring-primary/30'"
        @click="onboarding.selectType(opt.type)"
      >
        <UIcon :name="opt.icon" class="w-8 h-8 text-primary mb-3" />
        <p class="font-semibold">{{ opt.title }}</p>
        <p class="text-sm text-muted mt-1">{{ opt.description }}</p>
      </UCard>
    </div>

    <div v-else-if="selected && selected !== 'INDEPENDENT'" class="space-y-4">
      <UFormField :label="t('dashboard.onboarding.spaceNameLabel')">
        <UInput v-model="spaceName" :placeholder="onboarding.defaultName(selected)" class="w-full" />
      </UFormField>
    </div>

    <div class="flex justify-between">
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
  </div>
</template>
