<script setup lang="ts">
definePageMeta({ layout: 'dashboard', title: 'Budgets', middleware: 'auth' })

const { t } = useAppI18n()
useSeoMeta({ title: () => `${t('dashboard.budgets.title')} — ${t('common.appName')}` })

const { data: budgets, pending } = await useFetch('/api/budgets')

const isModalOpen = ref(false)

const categories = [
  'FOOD', 'TRANSPORT', 'SUBSCRIPTIONS', 'HOUSING', 'UTILITIES',
  'HEALTHCARE', 'ENTERTAINMENT', 'SHOPPING', 'SAVINGS', 'CLOUD_INFRA',
  'DEVELOPER_TOOLS', 'OTHER'
]

const newBudget = reactive({
  name: '',
  category: 'FOOD',
  amount: '',
  period: 'MONTHLY'
})

const isSaving = ref(false)

const periodItems = computed(() => [
  { label: t('frequencies.WEEKLY'), value: 'WEEKLY' },
  { label: t('frequencies.MONTHLY'), value: 'MONTHLY' },
  { label: t('frequencies.YEARLY'), value: 'YEARLY' }
])

async function saveBudget() {
  isSaving.value = true
  try {
    await $fetch('/api/budgets', {
      method: 'POST',
      body: {
        name: newBudget.name,
        category: newBudget.category,
        amount: parseFloat(newBudget.amount),
        period: newBudget.period
      }
    })
    isModalOpen.value = false
    await refreshNuxtData()
  } finally {
    isSaving.value = false
  }
}

function categoryLabel(cat: string): string {
  const key = `categories.${cat}`
  const translated = t(key)
  return translated !== key ? translated : cat
}

const overBudget = computed(() =>
  (budgets.value ?? []).filter(b => (b.spent / b.amount) >= 0.9).length
)
</script>

<template>
  <div class="p-6 space-y-6 max-w-3xl mx-auto">
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">{{ t('dashboard.budgets.title') }}</h1>
        <p class="text-sm text-muted mt-1">
          {{ t('dashboard.budgets.activeCount', { count: budgets?.length ?? 0 }) }}
          <span v-if="overBudget" class="text-error ml-1">
            {{ t('dashboard.budgets.nearLimit', { count: overBudget }) }}
          </span>
        </p>
      </div>
      <UButton
        :label="t('dashboard.budgets.newBudget')"
        icon="i-lucide-plus"
        @click="isModalOpen = true"
      />
    </div>

    <div v-if="pending" class="space-y-4">
      <UCard v-for="i in 4" :key="i" class="animate-pulse">
        <div class="space-y-3">
          <div class="h-4 w-32 bg-muted/50 rounded" />
          <div class="h-2 bg-muted/30 rounded" />
        </div>
      </UCard>
    </div>

    <UCard v-else-if="!budgets?.length" class="text-center py-12">
      <UIcon name="i-lucide-pie-chart" class="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
      <h3 class="font-semibold mb-1">{{ t('dashboard.budgets.emptyTitle') }}</h3>
      <p class="text-sm text-muted mb-4">
        {{ t('dashboard.budgets.emptyDescription') }}
      </p>
      <UButton
        :label="t('dashboard.budgets.createFirst')"
        icon="i-lucide-plus"
        @click="isModalOpen = true"
      />
    </UCard>

    <div v-else class="space-y-4">
      <UCard v-for="budget in budgets" :key="budget.id">
        <DashboardBudgetProgress :budget="budget" />
      </UCard>
    </div>

    <UModal v-model:open="isModalOpen" :title="t('dashboard.budgets.modalTitle')">
      <template #body>
        <div class="space-y-4">
          <UFormField :label="t('dashboard.budgets.nameLabel')">
            <UInput v-model="newBudget.name" :placeholder="t('dashboard.budgets.namePlaceholder')" class="w-full" />
          </UFormField>

          <UFormField :label="t('dashboard.budgets.categoryLabel')">
            <USelect
              v-model="newBudget.category"
              :options="categories.map(c => ({ label: categoryLabel(c), value: c }))"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('dashboard.budgets.limitLabel')">
            <UInput
              v-model="newBudget.amount"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('dashboard.budgets.periodLabel')">
            <USelect
              v-model="newBudget.period"
              :options="periodItems"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="isModalOpen = false" />
          <UButton
            :label="t('dashboard.budgets.createBudget')"
            :loading="isSaving"
            :disabled="!newBudget.name || !newBudget.amount"
            @click="saveBudget"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
