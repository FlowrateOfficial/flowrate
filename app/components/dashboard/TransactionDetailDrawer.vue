<script setup lang="ts">
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
  <UDrawer
    v-model:open="detailOpen"
    direction="right"
    :title="t('dashboard.transactions.detailTitle')"
    :description="selectedTx?.merchant ?? selectedTx?.description"
  >
    <template
      v-if="selectedTx"
      #body
    >
      <div class="space-y-6 p-4 sm:p-6">
        <div class="flex items-center gap-3">
          <DashboardPaymentIcon
            :name="selectedTx.merchant ?? selectedTx.description"
            :merchant="selectedTx.merchant"
            :category="selectedTx.category"
            size="lg"
          />
          <div class="min-w-0">
            <p class="truncate text-base font-semibold">
              {{ selectedTx.merchant ?? selectedTx.description }}
            </p>
            <p
              v-if="selectedTx.merchant"
              class="truncate text-sm text-muted"
            >
              {{ selectedTx.description }}
            </p>
          </div>
        </div>

        <USeparator />

        <div class="grid grid-cols-2 gap-4">
          <UFormField :label="t('dashboard.transactions.columns.amount')">
            <UBadge
              size="lg"
              :color="selectedTx.amount > 0 ? 'success' : 'neutral'"
              variant="subtle"
              class="tabular-nums text-base font-semibold"
              :label="`${selectedTx.amount > 0 ? '+' : '−'}${transactionsStore.formatAmount(selectedTx.amount, selectedTx.currency)}`"
            />
          </UFormField>
          <UFormField :label="t('dashboard.transactions.columns.date')">
            <UBadge
              color="neutral"
              variant="subtle"
              size="lg"
              :label="transactionsStore.formatDate(selectedTx.date)"
            />
          </UFormField>
        </div>

        <USeparator />

        <UFormField :label="t('dashboard.transactions.columns.category')">
          <USelect
            v-model="editCategory"
            :items="categoryItems"
            size="lg"
            class="w-full"
            @update:model-value="saveCategory"
          />
        </UFormField>

        <UFormField :label="t('dashboard.transactions.columns.account')">
          <UBadge
            color="neutral"
            variant="outline"
            size="lg"
            :label="selectedTx.account?.name ?? '—'"
            icon="i-lucide-landmark"
          />
        </UFormField>

        <UFormField
          v-if="selectedTx.paidBy || selectedTx.splitHint"
          :label="t('dashboard.transactions.columns.split')"
        >
          <div class="text-sm text-muted">
            <p v-if="selectedTx.paidBy">
              {{ t('dashboard.transactions.paidBy', { name: selectedTx.paidBy }) }}
            </p>
            <p v-if="selectedTx.splitHint">
              {{ t('dashboard.transactions.splitRule', { rule: selectedTx.splitHint }) }}
            </p>
          </div>
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end p-4 sm:p-6">
        <UButton
          :label="t('common.cancel')"
          color="neutral"
          variant="outline"
          @click="detailOpen = false"
        />
      </div>
    </template>
  </UDrawer>
</template>
