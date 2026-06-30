<script setup lang="ts">
// ANCHOR: Goals page — adult savings pots
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Goals', middleware: 'auth' })

const { t } = useAppI18n()
const goalsStore = useSavingsGoalsStore()
const { goals, loading, totalSaved, actionPending } = storeToRefs(goalsStore)

useDashboardSeo('dashboard.goals.title')

await useSpaceStoreFetch('savings-goals', () => goalsStore.fetchGoals())

const createOpen = ref(false)
const contributeOpen = ref(false)
const selectedGoalId = ref<string | null>(null)
const newGoalName = ref('')
const newGoalTarget = ref<number | null>(null)
const contributeAmount = ref<number | null>(null)

function openContribute(goalId: string) {
  selectedGoalId.value = goalId
  contributeAmount.value = null
  contributeOpen.value = true
}

async function submitCreate() {
  if (!newGoalName.value.trim()) return
  await goalsStore.createGoal({
    name: newGoalName.value.trim(),
    target: newGoalTarget.value
  })
  createOpen.value = false
  newGoalName.value = ''
  newGoalTarget.value = null
}

async function submitContribute() {
  if (!selectedGoalId.value || !contributeAmount.value || contributeAmount.value <= 0) return
  await goalsStore.contribute(selectedGoalId.value, contributeAmount.value)
  contributeOpen.value = false
}
</script>

<template>
  <DashboardPageShell max-width="lg">
    <DashboardPageHeader
      :title="t('dashboard.goals.title')"
      :description="t('dashboard.goals.subtitle')"
    >
      <template #actions>
        <UButton
          :label="t('dashboard.goals.newGoal')"
          icon="i-lucide-plus"
          @click="createOpen = true"
        />
      </template>
    </DashboardPageHeader>

    <UCard :ui="{ body: 'p-4 sm:p-6 text-center' }">
      <p class="text-sm font-medium text-muted">{{ t('dashboard.goals.totalSaved') }}</p>
      <p class="mt-1 text-3xl font-bold tabular-nums text-primary">
        {{ goalsStore.fmt(totalSaved) }}
      </p>
    </UCard>

    <DashboardCardSkeleton v-if="loading" :count="3" body-class="p-5" />

    <UCard v-else-if="!goals.length" :ui="{ body: 'p-6 sm:p-8 text-center' }">
      <UEmpty
        icon="i-lucide-target"
        :title="t('dashboard.goals.emptyTitle')"
        :description="t('dashboard.goals.emptyDescription')"
        variant="naked"
      >
        <template #actions>
          <UButton :label="t('dashboard.goals.newGoal')" icon="i-lucide-plus" @click="createOpen = true" />
        </template>
      </UEmpty>
    </UCard>

    <div v-else class="grid gap-3 sm:grid-cols-2">
      <UCard v-for="goal in goals" :key="goal.id" :ui="{ body: 'p-4 sm:p-5' }">
        <div class="mb-3 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-semibold truncate">{{ goal.name }}</p>
            <p class="mt-1 text-2xl font-bold tabular-nums">
              {{ goalsStore.fmt(goal.balance, goal.currency) }}
            </p>
          </div>
          <UButton
            :label="t('dashboard.goals.addFunds')"
            size="xs"
            color="neutral"
            variant="outline"
            :loading="actionPending === goal.id"
            @click="openContribute(goal.id)"
          />
        </div>
        <UProgress v-if="goal.target" :model-value="goal.progress ?? 0" size="sm" />
        <p v-if="goal.target" class="mt-1.5 text-xs text-muted">
          {{ t('dashboard.goals.target', { amount: goalsStore.fmt(goal.target, goal.currency) }) }}
        </p>
      </UCard>
    </div>

    <UModal v-model:open="createOpen" :title="t('dashboard.goals.newGoal')">
      <template #body>
        <div class="space-y-4">
          <UFormField :label="t('dashboard.goals.nameLabel')">
            <UInput v-model="newGoalName" class="w-full" />
          </UFormField>
          <UFormField :label="t('dashboard.goals.targetLabel')">
            <UInput v-model.number="newGoalTarget" type="number" min="0" step="1" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="createOpen = false" />
          <UButton
            :label="t('common.create')"
            :loading="actionPending === 'create'"
            @click="submitCreate"
          />
        </div>
      </template>
    </UModal>

    <UModal v-model:open="contributeOpen" :title="t('dashboard.goals.addFunds')">
      <template #body>
        <UFormField :label="t('dashboard.goals.amountLabel')">
          <UInput v-model.number="contributeAmount" type="number" min="0.01" step="0.01" class="w-full" />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="contributeOpen = false" />
          <UButton :label="t('common.save')" :loading="!!actionPending" @click="submitContribute" />
        </div>
      </template>
    </UModal>
  </DashboardPageShell>
</template>
