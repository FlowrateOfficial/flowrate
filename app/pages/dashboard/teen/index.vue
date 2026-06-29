<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'My Money', middleware: 'auth' })

const { t, formatCurrency } = useAppI18n()
const teenStore = useTeenStore()
const { dashboard: teen, pending } = storeToRefs(teenStore)

useSeoMeta({ title: () => `${t('nav.myMoney')} — ${t('common.appName')}` })

await useAsyncData('teen-dashboard', () => teenStore.fetchDashboard())

function fmt(n: number) {
  return formatCurrency(n)
}

const greeting = computed(() =>
  teen.value?.name
    ? t('dashboard.teen.greeting', { name: teen.value.name })
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
  <DashboardPageShell max-width="lg">
    <DashboardPageHeader
      :title="greeting"
      :description="t('dashboard.teen.subtitle')"
      :eyebrow="t('nav.myMoney')"
    >
      <template #actions>
        <UButton
          :label="t('dashboard.teen.connectBank')"
          icon="i-lucide-landmark"
          class="w-full sm:w-auto"
          to="/dashboard/accounts"
        />
        <UButton
          :label="t('nav.analytics')"
          icon="i-lucide-bar-chart-3"
          color="neutral"
          variant="outline"
          class="w-full sm:w-auto"
          to="/dashboard/analytics"
        />
      </template>
    </DashboardPageHeader>

    <UCard :ui="{ body: 'p-4 sm:p-6 text-center' }">
      <p class="text-sm font-medium text-muted">{{ t('dashboard.teen.totalSaved') }}</p>
      <p class="mt-1 text-3xl font-bold tabular-nums text-primary sm:text-4xl">
        {{ fmt(teen?.totalSaved ?? 0) }}
      </p>
      <p v-if="teen?.allowance" class="mt-2 text-sm text-muted">
        {{ t('dashboard.teen.allowance', {
          amount: fmt(teen.allowance),
          frequency: frequencyLabel(teen.frequency)
        }) }}
      </p>
    </UCard>

    <div>
      <h2 class="mb-3 text-base font-semibold sm:text-lg">{{ t('dashboard.teen.jarsTitle') }}</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <UCard v-for="jar in teen?.jars" :key="jar.id" :ui="{ body: 'p-4' }">
          <div class="mb-2 flex items-center justify-between gap-3">
            <p class="font-semibold">{{ jar.name }}</p>
            <p class="text-lg font-bold tabular-nums">{{ fmt(jar.balance) }}</p>
          </div>
          <UProgress v-if="jar.target" :model-value="jar.progress ?? 0" size="sm" />
          <p v-if="jar.target" class="mt-1.5 text-xs text-muted">
            {{ t('dashboard.family.child.goal', { amount: fmt(jar.target) }) }}
          </p>
        </UCard>
        <UCard v-if="!teen?.jars?.length && !pending" :ui="{ body: 'p-6 text-center' }" class="sm:col-span-2">
          <p class="text-sm text-muted">{{ t('dashboard.teen.noJars') }}</p>
        </UCard>
      </div>
    </div>

    <UAlert
      v-if="teen?.learnMode"
      :title="t('dashboard.teen.learnModeTitle')"
      :description="t('dashboard.teen.learnModeDescription')"
      icon="i-lucide-graduation-cap"
      variant="subtle"
    />
  </DashboardPageShell>
</template>
