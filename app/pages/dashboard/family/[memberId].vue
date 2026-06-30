<script setup lang="ts">
// ANCHOR: Family member detail — accounts, txs, allowance
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Child', middleware: 'auth' })

const { t } = useAppI18n()
const route = useRoute()
const { setBreadcrumbTail } = useBreadcrumbs()
const familyStore = useFamilyStore()
const spacesStore = useSpacesStore()
const { memberTab, saving, transactionColumns, memberFinancial, memberPending } = storeToRefs(familyStore)

const memberId = route.params.memberId as string
const spaceId = computed(() => spacesStore.space?.id ?? '')

useSpaceStoreFetch(`member-financial-${memberId}`, async () => {
  await familyStore.openMemberFinancial(memberId)
})

const data = memberFinancial
const pending = memberPending

watch(data, (val) => familyStore.loadAllowanceFromMember(val ?? null), { immediate: true })

watch(
  () => data.value?.member.name,
  (name) => setBreadcrumbTail(name ?? null),
  { immediate: true }
)

const summaryItems = computed(() => {
  if (!data.value) return []
  return [
    { label: t('dashboard.family.childBalance'), value: familyStore.fmt(data.value.stats.balance), icon: 'i-lucide-wallet' },
    { label: t('dashboard.family.spending30d'), value: familyStore.fmt(data.value.stats.spending30d), icon: 'i-lucide-arrow-up-from-line' },
    { label: t('dashboard.family.income30d'), value: familyStore.fmt(data.value.stats.income30d), icon: 'i-lucide-arrow-down-to-line' },
    { label: t('dashboard.family.transactionCount'), value: String(data.value.stats.transactionCount), icon: 'i-lucide-receipt' }
  ]
})

const columns = transactionColumns

const isChildMember = computed(() => {
  const role = data.value?.member.role
  return role === 'CHILD' || role === 'TEEN'
})

const deleteChildModalOpen = ref(false)
const isDeletingChild = ref(false)

async function confirmDeleteChild() {
  if (!spaceId.value) return
  isDeletingChild.value = true
  try {
    await familyStore.deleteChildAccount(spaceId.value, memberId, async () => {
      await navigateTo('/dashboard/family')
    })
    deleteChildModalOpen.value = false
  } finally {
    isDeletingChild.value = false
  }
}
</script>

<template>
  <DashboardPageShell>
    <DashboardPageHeader
      :title="data?.member.name ?? t('dashboard.family.childFallback')"
      :description="[
        familyStore.roleLabel(data?.member.role ?? ''),
        data?.member.email,
        data?.member.birthday ? familyStore.formatDate(data.member.birthday) : null
      ].filter(Boolean).join(' · ')"
      back-to="/dashboard/family"
    />

    <DashboardSummaryStrip :items="summaryItems" :loading="pending" />

    <UTabs v-model="memberTab" :items="familyStore.memberTabs" :content="false" />

    <div v-if="memberTab === 'overview'" class="grid gap-4 sm:grid-cols-2">
      <UCard :ui="{ body: 'p-4 sm:p-5' }">
        <h3 class="mb-3 text-base font-semibold">{{ t('dashboard.family.memberTabs.accounts') }}</h3>
        <p v-if="!data?.accounts.length" class="text-sm text-muted">{{ t('dashboard.family.noLinkedAccounts') }}</p>
        <div v-else class="space-y-3">
          <div v-for="acc in data.accounts" :key="acc.id" class="flex justify-between text-sm">
            <div>
              <p class="font-medium">{{ acc.name }}</p>
              <p class="text-xs text-muted">{{ acc.institution ?? acc.type }}</p>
            </div>
            <span class="tabular-nums font-medium">{{ familyStore.fmt(acc.balance, acc.currency) }}</span>
          </div>
        </div>
      </UCard>

      <UCard :ui="{ body: 'p-4 sm:p-5' }">
        <h3 class="mb-3 text-base font-semibold">{{ t('dashboard.family.recentActivity') }}</h3>
        <p v-if="!data?.transactions.length" class="text-sm text-muted">{{ t('dashboard.family.noTransactions') }}</p>
        <div v-else class="space-y-3">
          <div v-for="tx in data.transactions.slice(0, 5)" :key="tx.id" class="flex justify-between text-sm gap-4">
            <div class="min-w-0">
              <p class="font-medium truncate">{{ tx.merchant ?? tx.description }}</p>
              <p class="text-xs text-muted">{{ familyStore.formatDate(tx.date) }}</p>
            </div>
            <span class="tabular-nums shrink-0" :class="tx.amount > 0 ? 'text-success' : ''">
              {{ familyStore.fmt(Math.abs(tx.amount), tx.currency) }}
            </span>
          </div>
        </div>
      </UCard>
    </div>

    <UCard v-else-if="memberTab === 'accounts'" :ui="{ body: 'p-0 sm:p-0' }">
      <UTable
        :data="data?.accounts ?? []"
        :columns="[
          { accessorKey: 'name', header: t('dashboard.transactions.columns.account') },
          { accessorKey: 'type', header: 'Type' },
          { accessorKey: 'visibility', header: 'Visibility' },
          { accessorKey: 'balance', header: t('dashboard.transactions.columns.amount') }
        ]"
        :loading="pending"
      >
        <template #balance-cell="{ row }">
          <span class="tabular-nums font-medium">{{ familyStore.fmt(row.original.balance, row.original.currency) }}</span>
        </template>
        <template #visibility-cell="{ row }">
          <UBadge :label="row.original.visibility" variant="subtle" size="xs" />
        </template>
        <template #empty>
          <UEmpty
            icon="i-lucide-landmark"
            :title="t('dashboard.family.noLinkedAccounts')"
            variant="naked"
            size="sm"
            class="py-8"
          />
        </template>
      </UTable>
    </UCard>

    <UCard v-else-if="memberTab === 'transactions'" :ui="{ body: 'p-0 sm:p-0' }">
      <UTable :data="data?.transactions ?? []" :columns="columns" :loading="pending">
        <template #date-cell="{ row }">
          <span class="text-sm text-muted">{{ familyStore.formatDate(row.original.date) }}</span>
        </template>
        <template #description-cell="{ row }">
          <div class="flex min-w-0 items-center gap-3">
            <DashboardPaymentIcon
              :name="row.original.merchant ?? row.original.description"
              :merchant="row.original.merchant"
              :category="row.original.category"
              size="xs"
            />
            <p class="truncate text-sm font-medium">{{ row.original.merchant ?? row.original.description }}</p>
          </div>
        </template>
        <template #category-cell="{ row }">
          <UBadge :label="familyStore.categoryLabel(row.original.category)" variant="subtle" size="xs" />
        </template>
        <template #amount-cell="{ row }">
          <span class="tabular-nums font-semibold" :class="row.original.amount > 0 ? 'text-success' : ''">
            {{ row.original.amount > 0 ? '+' : '-' }}{{ familyStore.fmt(Math.abs(row.original.amount), row.original.currency) }}
          </span>
        </template>
        <template #empty>
          <UEmpty
            icon="i-lucide-receipt"
            :title="t('dashboard.family.noTransactions')"
            variant="naked"
            size="sm"
            class="py-8"
          />
        </template>
      </UTable>
    </UCard>

    <div v-else class="grid gap-4 sm:grid-cols-2">
      <UCard :ui="{ body: 'p-4 sm:p-5' }">
        <h3 class="mb-4 text-base font-semibold">{{ t('dashboard.family.child.title') }}</h3>
        <div class="space-y-4">
          <UFormField :label="t('dashboard.family.child.allowance')">
            <UInput v-model.number="familyStore.allowanceForm.allowance" type="number" min="0" class="w-full" />
          </UFormField>
          <UFormField :label="t('dashboard.family.child.frequency')">
            <USelect v-model="familyStore.allowanceForm.frequency" :items="familyStore.frequencyItems" class="w-full" />
          </UFormField>
          <UCheckbox v-model="familyStore.allowanceForm.learnMode" :label="t('dashboard.family.child.learnMode')" />
          <UButton
            :label="t('common.save')"
            :loading="saving"
            @click="familyStore.saveChildProfile(spaceId, memberId)"
          />
        </div>
      </UCard>

      <UCard :ui="{ body: 'p-4 sm:p-5' }">
        <h3 class="mb-4 text-base font-semibold">{{ t('dashboard.family.child.jarsTitle') }}</h3>
        <div class="space-y-3 mb-4">
          <div v-for="jar in data?.member.childProfile?.jars" :key="jar.id" class="flex justify-between text-sm">
            <span>{{ jar.name }}</span>
            <span class="font-medium tabular-nums">{{ familyStore.fmt(jar.balance) }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <UInput v-model="familyStore.jarName" :placeholder="t('dashboard.family.child.jarPlaceholder')" class="flex-1" />
          <UButton :label="t('common.add')" @click="familyStore.addJar(spaceId, memberId)" />
        </div>
      </UCard>
    </div>

    <UCard v-if="isChildMember" :ui="{ body: 'p-4 sm:p-5' }">
      <h3 class="mb-2 text-base font-semibold text-error">{{ t('dashboard.settings.dangerZone') }}</h3>
      <p class="text-sm text-muted mb-4">{{ t('dashboard.family.deleteChildDescription') }}</p>
      <UButton
        :label="t('dashboard.family.deleteChildAccount')"
        color="error"
        variant="outline"
        icon="i-lucide-trash-2"
        @click="deleteChildModalOpen = true"
      />
    </UCard>

    <UModal
      v-model:open="deleteChildModalOpen"
      :title="t('dashboard.family.deleteChildTitle', { name: data?.member.name ?? t('dashboard.family.childFallback') })"
    >
      <template #body>
        <p class="text-sm text-muted">{{ t('dashboard.family.deleteChildDescription') }}</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            :label="t('dashboard.settings.deleteCancel')"
            color="neutral"
            variant="outline"
            @click="deleteChildModalOpen = false"
          />
          <UButton
            :label="t('dashboard.family.deleteChildConfirm')"
            color="error"
            :loading="isDeletingChild"
            @click="confirmDeleteChild"
          />
        </div>
      </template>
    </UModal>
  </DashboardPageShell>
</template>
