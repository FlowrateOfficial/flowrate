<script setup lang="ts">
// ANCHOR: Family page — members, children, expense splits
import type { TableColumn } from '@nuxt/ui'
import { storeToRefs } from 'pinia'
import type { SpaceDetailMember } from '~/types/family'

definePageMeta({ layout: 'dashboard', title: 'Family', middleware: 'auth' })

const { t } = useAppI18n()
const familyStore = useFamilyStore()
const spacesStore = useSpacesStore()
const { tab, inviting, spaceDetail, pending } = storeToRefs(familyStore)

useDashboardSeo('dashboard.family.title')

const spaceId = computed(() => spacesStore.space?.id ?? '')

const deleteChildModalOpen = ref(false)
const childToDelete = ref<{ id: string, name: string } | null>(null)
const isDeletingChild = ref(false)

function promptDeleteChild(child: { id: string, name: string | null }) {
  childToDelete.value = { id: child.id, name: child.name ?? t('dashboard.family.childFallback') }
  deleteChildModalOpen.value = true
}

async function confirmDeleteChild() {
  if (!childToDelete.value || !spaceId.value) return
  isDeletingChild.value = true
  try {
    await familyStore.deleteChildAccount(spaceId.value, childToDelete.value.id)
    deleteChildModalOpen.value = false
    childToDelete.value = null
  } finally {
    isDeletingChild.value = false
  }
}

useSpaceStoreFetch('family-space', async () => {
  if (tab.value === 'splits') return
  familyStore.setDetailView(tab.value === 'children' ? 'children' : 'guardians')
  await familyStore.loadSpaceDetail()
}, [tab])

const children = computed(() =>
  (spaceDetail.value?.members ?? []).filter(m => m.role === 'CHILD' || m.role === 'TEEN')
)

const guardians = computed(() =>
  (spaceDetail.value?.members ?? []).filter(m => !['CHILD', 'TEEN'].includes(m.role))
)

const guardianColumns = computed<TableColumn<SpaceDetailMember>[]>(() => [
  { accessorKey: 'name', header: t('dashboard.family.membersTitle') },
  { accessorKey: 'role', header: t('dashboard.family.roleLabel') },
  { accessorKey: 'status', header: t('dashboard.family.statusHeader') },
  { id: 'actions', header: '' }
])

watch(tab, (val) => {
  if (val === 'splits' && spaceId.value) familyStore.fetchSplits(spaceId.value)
})

const spaceTypeHint = computed(() => {
  const type = spacesStore.space?.type
  if (type === 'HOUSEHOLD') return t('dashboard.family.hints.household')
  if (type === 'FAMILY') return t('dashboard.family.hints.family')
  if (type === 'INDEPENDENT') return t('dashboard.family.hints.independent')
  return ''
})
</script>

<template>
  <DashboardPageShell :show-guide="false">
    <DashboardPageHeader
      :title="t('dashboard.family.title')"
      :description="t('dashboard.family.subtitle')"
    >
      <template #actions>
        <UButton
          :label="t('dashboard.spaces.manageSpaces')"
          icon="i-lucide-layers"
          color="neutral"
          variant="outline"
          to="/dashboard/spaces"
        />
        <UButton
          :label="t('dashboard.accounts.title')"
          icon="i-lucide-landmark"
          color="neutral"
          variant="ghost"
          to="/dashboard/accounts"
        />
      </template>
    </DashboardPageHeader>

    <UAlert
      v-if="spaceTypeHint"
      :title="spacesStore.spaceType(spacesStore.space?.type ?? '')"
      :description="spaceTypeHint"
      color="neutral"
      variant="subtle"
      icon="i-lucide-info"
    />

    <UTabs v-model="tab" :items="familyStore.tabs" :content="false" />

    <div v-if="tab === 'members'" class="space-y-4">
      <UCard :ui="{ body: 'p-4 sm:p-5' }">
        <h2 class="mb-3 text-base font-semibold">{{ t('dashboard.family.inviteGuardian') }}</h2>
        <div class="grid sm:grid-cols-2 gap-4">
          <UFormField :label="t('dashboard.family.emailPlaceholder')">
            <UInput v-model="familyStore.inviteForm.email" type="email" :placeholder="t('dashboard.family.emailPlaceholder')" class="w-full" />
          </UFormField>
          <UFormField :label="t('dashboard.family.namePlaceholder')">
            <UInput v-model="familyStore.inviteForm.name" :placeholder="t('dashboard.family.namePlaceholder')" class="w-full" />
          </UFormField>
        </div>
        <UButton
          class="mt-4"
          :label="t('dashboard.family.sendInvite')"
          icon="i-lucide-mail"
          :loading="inviting"
          @click="familyStore.inviteMember(spaceId)"
        />
      </UCard>

      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <UTable
          :data="guardians"
          :columns="guardianColumns"
          :loading="pending"
        >
          <template #name-cell="{ row }">
            <div>
              <p class="font-medium">{{ row.original.name ?? row.original.email }}</p>
              <p class="text-xs text-muted">{{ row.original.email }}</p>
            </div>
          </template>
          <template #role-cell="{ row }">
            <UBadge :label="familyStore.roleLabel(row.original.role)" variant="subtle" color="neutral" size="xs" />
          </template>
          <template #status-cell="{ row }">
            <UBadge :label="familyStore.statusLabel(row.original.status)" variant="subtle" size="xs" />
          </template>
          <template #actions-cell="{ row }">
            <UButton
              v-if="row.original.role !== 'OWNER'"
              icon="i-lucide-user-minus"
              color="neutral"
              variant="ghost"
              size="xs"
              :aria-label="t('dashboard.family.removeMember')"
              @click="familyStore.removeMember(spaceId, row.original.id)"
            />
          </template>
        </UTable>
      </UCard>
    </div>

    <div v-else-if="tab === 'children'" class="space-y-4">
      <UCard :ui="{ body: 'p-4 sm:p-5' }">
        <h2 class="mb-1 text-base font-semibold">{{ t('dashboard.family.addChildTitle') }}</h2>
        <p class="mb-4 text-sm text-muted">{{ t('dashboard.family.addChildDescription') }}</p>
        <div class="grid sm:grid-cols-2 gap-4">
          <UFormField :label="t('dashboard.family.username')">
            <UInput v-model="familyStore.childForm.username" :placeholder="t('dashboard.family.usernamePlaceholder')" class="w-full" />
          </UFormField>
          <UFormField :label="t('dashboard.family.childEmail')">
            <UInput v-model="familyStore.childForm.email" type="email" :placeholder="t('dashboard.family.childEmailPlaceholder')" class="w-full" />
            <template #help>{{ t('dashboard.family.childEmailHelp') }}</template>
          </UFormField>
          <UFormField :label="t('dashboard.family.password')">
            <UInput v-model="familyStore.childForm.password" type="password" autocomplete="new-password" class="w-full" />
          </UFormField>
          <UFormField :label="t('dashboard.family.confirmPassword')">
            <UInput v-model="familyStore.childForm.confirmPassword" type="password" autocomplete="new-password" class="w-full" />
          </UFormField>
          <UFormField :label="t('dashboard.family.birthday')">
            <DashboardDateField v-model="familyStore.childForm.birthday" :placeholder="t('dashboard.family.birthday')" />
          </UFormField>
          <UFormField :label="t('dashboard.family.roleLabel')">
            <USelect v-model="familyStore.childForm.role" :items="familyStore.childRoleItems" class="w-full" />
          </UFormField>
        </div>
        <UButton class="mt-4" :label="t('dashboard.family.createAccount')" icon="i-lucide-user-plus" :loading="inviting" @click="familyStore.addChild(spaceId)" />
      </UCard>

      <UEmpty
        v-if="!children.length && !pending"
        icon="i-lucide-baby"
        :title="t('dashboard.family.noChildrenTitle')"
        :description="t('dashboard.family.noChildrenDescription')"
        variant="naked"
        class="py-8"
      />

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <UCard
          v-for="child in children"
          :key="child.id"
          :ui="{ body: 'p-4 sm:p-5' }"
        >
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="flex items-center gap-3">
              <UAvatar :alt="child.name ?? 'C'" size="md" />
              <div>
                <p class="font-medium">{{ child.name }}</p>
                <p class="text-xs text-muted">
                  {{ child.role === 'TEEN' ? t('dashboard.family.teenAccount') : t('dashboard.family.guardianManaged') }}
                </p>
              </div>
            </div>
            <UBadge :label="familyStore.statusLabel(child.status)" variant="subtle" size="xs" />
          </div>

          <div v-if="child.financialSummary" class="mb-3 grid grid-cols-2 gap-2">
            <div class="rounded-lg bg-elevated/50 p-2.5">
              <p class="text-xs text-muted">{{ t('dashboard.family.childBalance') }}</p>
              <p class="text-base font-semibold tabular-nums">{{ familyStore.fmt(child.financialSummary.balance) }}</p>
            </div>
            <div class="rounded-lg bg-elevated/50 p-2.5">
              <p class="text-xs text-muted">{{ t('dashboard.family.spending30d') }}</p>
              <p class="text-base font-semibold tabular-nums">{{ familyStore.fmt(child.financialSummary.spending30d) }}</p>
            </div>
          </div>

          <div v-if="child.childProfile" class="text-xs text-muted mb-4">
            {{
              child.childProfile.allowance
                ? t('dashboard.family.allowance', {
                  amount: familyStore.fmt(child.childProfile.allowance)
                    + (child.childProfile.frequency
                      ? `/${t(`frequencies.${child.childProfile.frequency}`).toLowerCase()}`
                      : '')
                })
                : t('dashboard.family.allowanceNotSet')
            }}
            · {{ t('dashboard.family.savingsJars', { count: child.childProfile.jars?.length ?? 0 }) }}
            · {{ t('dashboard.family.linkedAccounts', { count: child.financialSummary?.accountCount ?? 0 }) }}
          </div>

          <UButton
            :label="t('dashboard.family.viewDetails')"
            icon="i-lucide-arrow-right"
            trailing
            block
            :to="`/dashboard/family/${child.id}`"
          />
          <UButton
            class="mt-2"
            :label="t('dashboard.family.deleteChildAccount')"
            icon="i-lucide-trash-2"
            color="error"
            variant="outline"
            block
            @click="promptDeleteChild(child)"
          />
        </UCard>
      </div>
    </div>

    <div v-else class="space-y-4">
      <UCard :ui="{ body: 'p-4 sm:p-5' }">
        <h2 class="mb-3 text-base font-semibold">{{ t('dashboard.family.splits.addTitle') }}</h2>
        <div class="grid sm:grid-cols-2 gap-4">
          <UInput v-model="familyStore.splitForm.name" :placeholder="t('dashboard.family.splits.namePlaceholder')" />
          <USelect
            v-model="familyStore.splitForm.category"
            :items="familyStore.categoryItems"
            class="w-full"
          />
        </div>
        <UButton class="mt-4" :label="t('common.add')" @click="familyStore.createSplit(spaceId)" />
      </UCard>
      <UEmpty
        v-if="!familyStore.splits.length"
        icon="i-lucide-split"
        :title="t('dashboard.family.splits.empty')"
        variant="naked"
        class="py-8"
      />
      <div v-else class="grid gap-3 sm:grid-cols-2">
        <UCard v-for="rule in familyStore.splits" :key="rule.id" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="font-medium">{{ rule.name }}</p>
          <p class="text-xs text-muted mt-1">{{ rule.mode }} · {{ rule.category ?? t('dashboard.family.splits.allCategories') }}</p>
        </UCard>
      </div>
    </div>

    <UModal
      v-model:open="deleteChildModalOpen"
      :title="childToDelete ? t('dashboard.family.deleteChildTitle', { name: childToDelete.name }) : ''"
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
