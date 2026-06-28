<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { formatCurrencyForLocale } from '~/utils/format'

definePageMeta({ layout: 'dashboard', title: 'My Money', middleware: 'auth' })

const { t, getLocale } = useAppI18n()
const teenStore = useTeenStore()
const { dashboard: teen, pending } = storeToRefs(teenStore)

useSeoMeta({ title: () => `${t('nav.myMoney')} — ${t('common.appName')}` })

await useAsyncData('teen-dashboard', () => teenStore.fetchDashboard())

function fmt(n: number) {
  return formatCurrencyForLocale(n, getLocale(), 'USD')
}

const greeting = computed(() =>
  teen.value?.displayName
    ? t('dashboard.teen.greeting', { name: teen.value.displayName })
    : t('dashboard.teen.greetingDefault')
)

function frequencyLabel(freq?: string | null) {
  if (!freq) return ''
  const key = `frequencies.${freq}`
  const translated = t(key)
  return translated !== key ? translated.toLowerCase() : freq.toLowerCase()
}
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <div class="text-center space-y-4">
      <div>
        <h1 class="text-2xl font-bold">{{ greeting }}</h1>
        <p class="text-sm text-muted mt-1">{{ t('dashboard.teen.subtitle') }}</p>
      </div>
      <div class="flex flex-wrap justify-center gap-2">
        <UButton
          :label="t('dashboard.teen.connectBank')"
          icon="i-lucide-landmark"
          size="sm"
          to="/dashboard/accounts"
        />
        <UButton
          :label="t('nav.analytics')"
          icon="i-lucide-bar-chart-3"
          size="sm"
          color="neutral"
          variant="outline"
          to="/dashboard/analytics"
        />
      </div>
    </div>

    <UCard class="text-center py-8">
      <p class="text-sm text-muted mb-1">{{ t('dashboard.teen.totalSaved') }}</p>
      <p class="text-4xl font-bold text-primary">{{ fmt(teen?.totalSaved ?? 0) }}</p>
      <p v-if="teen?.allowanceAmount" class="text-sm text-muted mt-2">
        {{ t('dashboard.teen.allowance', {
          amount: fmt(teen.allowanceAmount),
          frequency: frequencyLabel(teen.allowanceFrequency)
        }) }}
      </p>
    </UCard>

    <div class="space-y-3">
      <h2 class="font-semibold">{{ t('dashboard.teen.jarsTitle') }}</h2>
      <UCard v-for="jar in teen?.jars" :key="jar.id">
        <div class="flex justify-between items-center mb-2">
          <p class="font-medium">{{ jar.name }}</p>
          <p class="font-semibold">{{ fmt(jar.balance) }}</p>
        </div>
        <UProgress v-if="jar.targetAmount" :model-value="jar.progress ?? 0" />
        <p v-if="jar.targetAmount" class="text-xs text-muted mt-1">
          {{ t('dashboard.family.child.goal', { amount: fmt(jar.targetAmount) }) }}
        </p>
      </UCard>
      <p v-if="!teen?.jars?.length && !pending" class="text-sm text-muted text-center py-4">
        {{ t('dashboard.teen.noJars') }}
      </p>
    </div>

    <UAlert
      v-if="teen?.learnMode"
      :title="t('dashboard.teen.learnModeTitle')"
      :description="t('dashboard.teen.learnModeDescription')"
      icon="i-lucide-graduation-cap"
      variant="subtle"
    />
  </div>
</template>
