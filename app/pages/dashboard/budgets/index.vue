<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Budgets', middleware: 'auth' })

const { t } = useAppI18n()
const budgetsStore = useBudgetsStore()
const {
  budgets,
  pending,
  isModalOpen,
  isSaving,
  overBudgetCount,
  summaryItems
} = storeToRefs(budgetsStore)

const subtitle = computed(() =>
  budgets.value.length === 1
    ? t('dashboard.budgets.subtitleOne')
    : t('dashboard.budgets.subtitleMany', { count: budgets.value.length })
)

const spaceId = computed(() => useSpacesStore().activeSpace?.id)
await useAsyncData(
  () => `budgets-${spaceId.value}`,
  async () => {
    await budgetsStore.fetchBudgets()
    return null
  },
  { watch: [spaceId] }
)

useSeoMeta({ title: () => `${t('dashboard.budgets.title')} — ${t('common.appName')}` })
</script>

<template>
  <div class="px-6 sm:px-10 py-10 sm:py-14 space-y-8 max-w-5xl mx-auto">
    <DashboardPageHeader
      :title="t('dashboard.budgets.title')"
      :description="subtitle"
    >
      <template #actions>
        <UButton
          :label="t('dashboard.budgets.newBudget')"
          icon="i-lucide-plus"
          color="neutral"
          class="rounded-flow"
          @click="isModalOpen = true"
        />
      </template>
    </DashboardPageHeader>

    <UAlert
      v-if="overBudgetCount"
      :title="t('dashboard.budgets.nearLimitAlert', { count: overBudgetCount })"
      color="warning"
      variant="subtle"
      icon="i-lucide-alert-triangle"
    />

    <DashboardSummaryStrip :items="summaryItems" :loading="pending" />

    <div v-if="!pending && !budgets.length" class="editorial-card-flat text-center py-16">
      <UIcon name="i-lucide-pie-chart" class="w-10 h-10 mx-auto mb-4 text-muted opacity-40 stroke-[1.25]" />
      <h3 class="font-display text-xl mb-2">{{ t('dashboard.budgets.emptyTitle') }}</h3>
      <p class="text-sm text-muted max-w-md mx-auto mb-6">{{ t('dashboard.budgets.emptyDescription') }}</p>
      <UButton
        :label="t('dashboard.budgets.createFirst')"
        icon="i-lucide-plus"
        color="neutral"
        @click="isModalOpen = true"
      />
    </div>

    <div v-else class="space-y-4">
      <div v-for="budget in budgets" :key="budget.id" class="editorial-card-flat relative">
        <UButton
          icon="i-lucide-trash-2"
          color="neutral"
          variant="ghost"
          size="xs"
          class="absolute top-4 right-4"
          :aria-label="t('common.delete')"
          @click="budgetsStore.deleteBudget(budget.id)"
        />
        <DashboardBudgetProgress :budget="budget" />
      </div>
    </div>

    <UModal v-model:open="isModalOpen" :title="t('dashboard.budgets.modalTitle')">
      <template #body>
        <div class="space-y-4">
          <UFormField :label="t('dashboard.budgets.nameLabel')">
            <UInput v-model="budgetsStore.newBudget.name" :placeholder="t('dashboard.budgets.namePlaceholder')" class="w-full" />
          </UFormField>
          <UFormField :label="t('dashboard.budgets.categoryLabel')">
            <USelect v-model="budgetsStore.newBudget.category" :items="budgetsStore.categoryItems" class="w-full" />
          </UFormField>
          <UFormField :label="t('dashboard.budgets.limitLabel')">
            <UInput v-model="budgetsStore.newBudget.amount" type="number" placeholder="0.00" min="0" step="0.01" class="w-full" />
          </UFormField>
          <UFormField :label="t('dashboard.budgets.periodLabel')">
            <USelect v-model="budgetsStore.newBudget.period" :items="budgetsStore.periodItems" class="w-full" />
          </UFormField>
          <UCheckbox
            v-if="budgetsStore.newBudget"
            v-model="budgetsStore.newBudget.isShared"
            :label="t('dashboard.budgets.sharedLabel')"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="isModalOpen = false" />
          <UButton
            :label="t('dashboard.budgets.createBudget')"
            :loading="isSaving"
            :disabled="!budgetsStore.newBudget.name || !budgetsStore.newBudget.amount"
            @click="budgetsStore.createBudget()"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
