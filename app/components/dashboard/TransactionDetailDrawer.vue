<script setup lang="ts">
import type { TransactionRow } from '~/types/financial'

const transactionsStore = useTransactionsStore()
const { selectedTx, detailOpen } = storeToRefs(transactionsStore)
const { t } = useAppI18n()

const categories = [
  'FOOD', 'TRANSPORT', 'SUBSCRIPTIONS', 'HOUSING', 'UTILITIES',
  'HEALTHCARE', 'ENTERTAINMENT', 'SHOPPING', 'SAVINGS', 'INCOME',
  'CLOUD_INFRA', 'DEVELOPER_TOOLS', 'OTHER'
]

const categoryItems = computed(() =>
  categories.map(c => ({
    label: transactionsStore.categoryLabel(c),
    value: c
  }))
)

const editCategory = ref('')

watch(selectedTx, (tx) => {
  if (tx) editCategory.value = tx.category
}, { immediate: true })

async function saveCategory() {
  if (!selectedTx.value || editCategory.value === selectedTx.value.category) return
  await transactionsStore.updateCategory(selectedTx.value.id, editCategory.value)
}
</script>

<template>
  <UModal v-model:open="detailOpen" :title="t('dashboard.transactions.detailTitle')">
    <template v-if="selectedTx" #body>
      <div class="space-y-6">
        <div>
          <p class="font-display text-xl">{{ selectedTx.merchant ?? selectedTx.description }}</p>
          <p v-if="selectedTx.merchant" class="text-sm text-muted mt-1">{{ selectedTx.description }}</p>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-muted mb-1">{{ t('dashboard.transactions.columns.amount') }}</p>
            <p class="text-xl font-light tabular-nums">
              {{ selectedTx.amount > 0 ? '+' : '−' }}{{ transactionsStore.formatAmount(selectedTx.amount, selectedTx.currency) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-1">{{ t('dashboard.transactions.columns.date') }}</p>
            <p class="text-sm">{{ transactionsStore.formatDate(selectedTx.date) }}</p>
          </div>
        </div>
        <UFormField :label="t('dashboard.transactions.columns.category')">
          <USelect v-model="editCategory" :items="categoryItems" class="w-full" @update:model-value="saveCategory" />
        </UFormField>
        <div>
          <p class="text-xs text-muted mb-1">{{ t('dashboard.transactions.columns.account') }}</p>
          <p class="text-sm">{{ selectedTx.account?.name ?? '—' }}</p>
        </div>
      </div>
    </template>
  </UModal>
</template>
