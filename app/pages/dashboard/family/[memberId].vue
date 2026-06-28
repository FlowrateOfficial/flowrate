<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Child', middleware: 'auth' })

const { t } = useAppI18n()
const route = useRoute()
const { setBreadcrumbTail } = useBreadcrumbs()
const familyStore = useFamilyStore()
const spacesStore = useSpacesStore()
const { memberTab, saving } = storeToRefs(familyStore)

const memberId = route.params.memberId as string
const spaceId = computed(() => spacesStore.activeSpace?.id ?? '')

const { data, pending, refresh } = await useAsyncData(
  () => `member-financial-${spaceId.value}-${memberId}`,
  () => spaceId.value
    ? familyStore.fetchMemberFinancial(spaceId.value, memberId)
    : Promise.resolve(null),
  { watch: [spaceId] }
)

watch(data, (val) => familyStore.loadAllowanceFromMember(val), { immediate: true })

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

const columns = computed(() => familyStore.transactionColumns())

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
  <div class="px-6 sm:px-10 py-10 sm:py-14 space-y-8 max-w-7xl mx-auto">
    <div>
      <UButton
        to="/dashboard/family"
        icon="i-lucide-arrow-left"
        :label="t('common.back')"
        variant="ghost"
        color="neutral"
        size="sm"
      />
      <h1 class="font-display text-3xl mt-4 tracking-tight">{{ data?.member.name ?? t('dashboard.family.childFallback') }}</h1>
      <p class="text-sm text-muted mt-1">
        {{ familyStore.roleLabel(data?.member.role ?? '') }}
        <span v-if="data?.member.email"> · {{ data.member.email }}</span>
        <span v-if="data?.member.dateOfBirth"> · {{ familyStore.formatDate(data.member.dateOfBirth) }}</span>
      </p>
    </div>

    <DashboardSummaryStrip :items="summaryItems" :loading="pending" />

    <UTabs v-model="memberTab" :items="familyStore.memberTabs" :content="false" />

    <div v-if="memberTab === 'overview'" class="grid sm:grid-cols-2 gap-6">
      <UCard :ui="{ body: 'p-6' }">
        <h3 class="font-display text-lg mb-4">{{ t('dashboard.family.memberTabs.accounts') }}</h3>
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

      <UCard :ui="{ body: 'p-6' }">
        <h3 class="font-display text-lg mb-4">{{ t('dashboard.family.recentActivity') }}</h3>
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
          <p class="text-center py-12 text-muted text-sm">{{ t('dashboard.family.noLinkedAccounts') }}</p>
        </template>
      </UTable>
    </UCard>

    <UCard v-else-if="memberTab === 'transactions'" :ui="{ body: 'p-0 sm:p-0' }">
      <UTable :data="data?.transactions ?? []" :columns="columns" :loading="pending">
        <template #date-cell="{ row }">
          <span class="text-sm text-muted">{{ familyStore.formatDate(row.original.date) }}</span>
        </template>
        <template #description-cell="{ row }">
          <p class="text-sm font-medium truncate">{{ row.original.merchant ?? row.original.description }}</p>
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
          <p class="text-center py-12 text-muted text-sm">{{ t('dashboard.family.noTransactions') }}</p>
        </template>
      </UTable>
    </UCard>

    <div v-else class="grid sm:grid-cols-2 gap-6">
      <UCard :ui="{ body: 'p-6 sm:p-8' }">
        <h3 class="font-display text-lg mb-6">{{ t('dashboard.family.child.title') }}</h3>
        <div class="space-y-4">
          <UFormField :label="t('dashboard.family.child.allowanceAmount')">
            <UInput v-model.number="familyStore.allowanceForm.allowanceAmount" type="number" min="0" class="w-full" />
          </UFormField>
          <UFormField :label="t('dashboard.family.child.frequency')">
            <USelect v-model="familyStore.allowanceForm.allowanceFrequency" :items="familyStore.frequencyItems" class="w-full" />
          </UFormField>
          <UCheckbox v-model="familyStore.allowanceForm.learnMode" :label="t('dashboard.family.child.learnMode')" />
          <UButton
            :label="t('common.save')"
            :loading="saving"
            @click="familyStore.saveChildProfile(spaceId, memberId, refresh)"
          />
        </div>
      </UCard>

      <UCard :ui="{ body: 'p-6 sm:p-8' }">
        <h3 class="font-display text-lg mb-6">{{ t('dashboard.family.child.jarsTitle') }}</h3>
        <div class="space-y-3 mb-4">
          <div v-for="jar in data?.member.childProfile?.jars" :key="jar.id" class="flex justify-between text-sm">
            <span>{{ jar.name }}</span>
            <span class="font-medium tabular-nums">{{ familyStore.fmt(jar.balance) }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <UInput v-model="familyStore.jarName" :placeholder="t('dashboard.family.child.jarPlaceholder')" class="flex-1" />
          <UButton :label="t('common.add')" @click="familyStore.addJar(spaceId, memberId, refresh)" />
        </div>
      </UCard>
    </div>

    <UCard v-if="isChildMember" :ui="{ body: 'p-6 sm:p-8' }">
      <h3 class="font-display text-lg mb-2 text-error">{{ t('dashboard.settings.dangerZone') }}</h3>
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
  </div>
</template>
