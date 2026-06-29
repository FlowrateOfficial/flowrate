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
  isEditing,
  overBudgetCount,
  summaryItems
} = storeToRefs(budgetsStore)

const subtitle = computed(() =>
  budgets.value.length === 1
    ? t('dashboard.budgets.subtitleOne')
    : t('dashboard.budgets.subtitleMany', { count: budgets.value.length })
)

const modalTitle = computed(() =>
  isEditing.value ? t('dashboard.budgets.editModalTitle') : t('dashboard.budgets.modalTitle')
)

const spaceId = computed(() => useSpacesStore().space?.id)
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
  <DashboardPageShell max-width="xl" :show-guide="false">
    <DashboardPageHeader
      :title="t('dashboard.budgets.title')"
      :description="subtitle"
    >
      <template #actions>
        <UButton
          :label="t('dashboard.budgets.newBudget')"
          icon="i-lucide-plus"
          color="neutral"
          @click="budgetsStore.openCreateModal()"
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

    <UCard v-if="!pending && !budgets.length" :ui="{ body: 'p-6 sm:p-8 text-center' }">
      <UEmpty
        icon="i-lucide-pie-chart"
        :title="t('dashboard.budgets.emptyTitle')"
        :description="t('dashboard.budgets.emptyDescription')"
        variant="naked"
      >
        <template #actions>
          <UButton
            :label="t('dashboard.budgets.createFirst')"
            icon="i-lucide-plus"
            @click="budgetsStore.openCreateModal()"
          />
        </template>
      </UEmpty>
    </UCard>

    <div v-else class="grid gap-3 sm:grid-cols-2">
      <UCard v-for="budget in budgets" :key="budget.id" :ui="{ body: 'p-4 sm:p-5' }">
        <DashboardBudgetProgress :budget="budget">
          <template #actions>
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              size="xs"
              :aria-label="t('common.edit')"
              @click="budgetsStore.openEditModal(budget)"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              size="xs"
              :aria-label="t('common.delete')"
              @click="budgetsStore.deleteBudget(budget.id)"
            />
          </template>
        </DashboardBudgetProgress>
      </UCard>
    </div>

    <UModal
      v-model:open="isModalOpen"
      :title="modalTitle"
      @update:open="(open) => { if (!open) budgetsStore.closeModal() }"
    >
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
            v-model="budgetsStore.newBudget.isShared"
            :label="t('dashboard.budgets.sharedLabel')"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="budgetsStore.closeModal()" />
          <UButton
            :label="isEditing ? t('common.save') : t('dashboard.budgets.createBudget')"
            :loading="isSaving"
            :disabled="!budgetsStore.newBudget.name || !budgetsStore.newBudget.amount"
            @click="budgetsStore.saveBudget()"
          />
        </div>
      </template>
    </UModal>
  </DashboardPageShell>
</template>
