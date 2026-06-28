<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { formatCurrencyForLocale } from '~/utils/format'
import type { BusinessOverview } from '~/types/dashboard'

definePageMeta({ layout: 'dashboard', title: 'Business', middleware: 'auth' })

const route = useRoute()
const { t, getLocale } = useAppI18n()
const spacesStore = useSpacesStore()
const businessStore = useBusinessStore()
const { tab, inviting, overview, overviewPending } = storeToRefs(businessStore)
const { isBusinessReadOnly, canManageBusiness } = storeToRefs(spacesStore)

useSeoMeta({ title: () => `${t('dashboard.company.title')} — ${t('common.appName')}` })

const spaceId = computed(() => spacesStore.activeSpace?.id ?? '')

const { data: spaceDetail, refresh: refreshTeam } = await useAsyncData(
  () => `business-team-${spaceId.value}`,
  () => spaceId.value ? businessStore.fetchSpaceDetail(spaceId.value) : Promise.resolve(null),
  { watch: [spaceId] }
)

await useAsyncData(
  () => `business-overview-${spaceId.value}`,
  () => spaceId.value ? businessStore.fetchOverview(spaceId.value) : Promise.resolve(),
  { watch: [spaceId] }
)

const pending = overviewPending

onMounted(() => {
  if (route.query.tab === 'team') businessStore.tab = 'team'
})

watch(() => route.query.tab, (val) => {
  if (val === 'team') businessStore.tab = 'team'
  else if (val === 'overview') businessStore.tab = 'overview'
})

const teamMembers = computed(() => spaceDetail.value?.members ?? [])

function fmt(n: number) {
  return formatCurrencyForLocale(n, getLocale(), 'USD')
}

function runwayLabel(months: number | null | undefined) {
  if (months == null || months > 99) return t('dashboard.company.stats.infinite')
  return t('dashboard.company.stats.months', { count: months })
}

function alertMessage(alert: BusinessOverview['alerts'][number]) {
  const key = `dashboard.company.alerts.${alert.code}`
  const params = alert.params
    ? Object.fromEntries(Object.entries(alert.params).map(([k, v]) => [k, String(v)]))
    : undefined
  return t(key, params)
}

const setupSteps = computed(() => [
  {
    done: overview.value?.setup.hasAccounts,
    title: t('dashboard.company.setup.step1Title'),
    description: t('dashboard.company.setup.step1Desc'),
    to: '/dashboard/accounts',
    cta: t('dashboard.company.setup.step1Cta')
  },
  {
    done: overview.value?.setup.hasTransactions,
    title: t('dashboard.company.setup.step2Title'),
    description: t('dashboard.company.setup.step2Desc'),
    to: '/dashboard/transactions',
    cta: t('dashboard.company.setup.step2Cta')
  },
  {
    done: overview.value?.setup.complete,
    title: t('dashboard.company.setup.step3Title'),
    description: t('dashboard.company.setup.step3Desc'),
    to: '/dashboard/subscriptions',
    cta: t('dashboard.company.setup.step3Cta')
  }
])
</script>

<template>
  <div class="px-6 sm:px-10 py-10 sm:py-14 space-y-8 max-w-6xl mx-auto">
    <DashboardPageHeader
      :title="t('dashboard.company.title')"
      :description="t('dashboard.company.subtitle')"
    >
      <template v-if="spacesStore.isCompany && overview?.setup.complete" #actions>
        <UButton
          :label="t('dashboard.company.setup.syncCta')"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          to="/dashboard/accounts"
        />
      </template>
    </DashboardPageHeader>

    <UAlert
      v-if="isBusinessReadOnly"
      :title="t('dashboard.company.readOnlyTitle')"
      :description="t('dashboard.company.readOnlyDesc')"
      color="neutral"
      variant="subtle"
      icon="i-lucide-eye"
    />

    <div v-if="spacesStore.activeSpace?.type !== 'COMPANY'" class="text-center py-16 editorial-card">
      <UIcon name="i-lucide-rocket" class="w-12 h-12 mx-auto text-muted opacity-50 mb-4 stroke-[1.25]" />
      <h2 class="font-display text-xl mb-2">{{ t('dashboard.company.noBusinessTitle') }}</h2>
      <p class="text-sm text-muted max-w-md mx-auto mb-6">{{ t('dashboard.company.switchHint') }}</p>
      <UButton to="/dashboard/spaces" :label="t('dashboard.company.createBusinessCta')" icon="i-lucide-plus" />
    </div>

    <template v-else>
      <UTabs v-if="canManageBusiness" v-model="tab" :items="businessStore.tabs" :content="false" class="mb-2" />

      <div v-if="tab === 'team' && canManageBusiness" class="space-y-6">
        <UCard :ui="{ body: 'p-6 sm:p-8' }">
          <h2 class="font-display text-lg mb-1">{{ t('dashboard.company.team.inviteTitle') }}</h2>
          <p class="text-sm text-muted mb-6">{{ t('dashboard.company.team.inviteDesc') }}</p>

          <div class="grid sm:grid-cols-2 gap-4">
            <UFormField :label="t('dashboard.company.team.phone')">
              <UInput v-model="businessStore.inviteForm.phone" type="tel" autocomplete="tel" class="w-full" />
              <template #help>{{ t('dashboard.company.team.phoneHelp') }}</template>
            </UFormField>
            <UFormField :label="t('dashboard.company.team.email')">
              <UInput v-model="businessStore.inviteForm.email" type="email" class="w-full" />
              <template #help>{{ t('dashboard.company.team.emailOptional') }}</template>
            </UFormField>
            <UFormField :label="t('dashboard.company.team.name')">
              <UInput v-model="businessStore.inviteForm.displayName" class="w-full" />
            </UFormField>
          </div>

          <UFormField :label="t('dashboard.company.team.role')" class="mt-4">
            <USelect
              v-model="businessStore.inviteForm.role"
              :items="businessStore.roleItems"
              value-key="value"
              class="w-full max-w-md"
            />
            <template #help>
              {{
                businessStore.inviteForm.role === 'FINANCE_ADMIN'
                  ? t('dashboard.company.team.roles.financeAdminDesc')
                  : t('dashboard.company.team.roles.guestDesc')
              }}
            </template>
          </UFormField>

          <UButton
            class="mt-6"
            :label="t('dashboard.company.team.sendInvite')"
            icon="i-lucide-mail"
            :loading="inviting"
            @click="businessStore.inviteMember(spaceId, () => refreshTeam())"
          />
        </UCard>

        <UCard :ui="{ body: 'p-0' }">
          <div class="px-6 py-4 border-b border-default">
            <h2 class="font-display text-lg">{{ t('dashboard.company.team.membersTitle') }}</h2>
          </div>
          <ul class="divide-y divide-default">
            <li
              v-for="member in teamMembers"
              :key="member.id"
              class="flex items-center justify-between gap-4 px-6 py-4"
            >
              <div class="min-w-0">
                <p class="font-medium truncate">{{ member.name ?? member.email }}</p>
                <p v-if="member.email" class="text-xs text-muted truncate">{{ member.email }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <UBadge :label="businessStore.roleLabel(member.role)" variant="subtle" color="neutral" size="xs" />
                <UBadge :label="businessStore.statusLabel(member.status)" variant="subtle" size="xs" />
              </div>
            </li>
          </ul>
        </UCard>
      </div>

      <template v-else>
        <div v-if="pending" class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div v-for="i in 4" :key="i" class="editorial-card h-32 animate-pulse bg-elevated/40" />
        </div>

        <template v-else-if="overview">
      <!-- NOTE - Guided setup when empty -->
          <UCard v-if="!overview.setup.complete" :ui="{ body: 'p-6 sm:p-8' }">
            <h2 class="font-display text-xl mb-2">{{ t('dashboard.company.setup.title') }}</h2>
            <p class="text-sm text-muted mb-8 max-w-2xl">{{ t('dashboard.company.setup.subtitle') }}</p>

            <ol class="space-y-6">
              <li
                v-for="(step, index) in setupSteps"
                :key="index"
                class="flex gap-4"
              >
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium"
                  :class="step.done ? 'bg-green-500/15 text-green-600' : 'bg-elevated text-muted'"
                >
                  <UIcon v-if="step.done" name="i-lucide-check" class="w-4 h-4" />
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium">{{ step.title }}</p>
                  <p class="text-sm text-muted mt-1">{{ step.description }}</p>
                  <UButton
                    v-if="!step.done && !isBusinessReadOnly"
                    class="mt-3"
                    size="sm"
                    :label="step.cta"
                    :to="step.to"
                  />
                </div>
              </li>
            </ol>
          </UCard>

          <!-- NOTE - Alerts -->
          <div v-if="overview.alerts.length" class="space-y-3">
            <h2 class="font-display text-lg">{{ t('dashboard.company.alertsTitle') }}</h2>
            <UAlert
              v-for="(alert, i) in overview.alerts"
              :key="`${alert.code}-${i}`"
              :description="alertMessage(alert)"
              :color="alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'neutral'"
              variant="subtle"
              :icon="alert.severity === 'critical' ? 'i-lucide-alert-circle' : alert.severity === 'warning' ? 'i-lucide-triangle-alert' : 'i-lucide-info'"
            />
          </div>

          <!-- NOTE - Metrics -->
          <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <DashboardStatsCard
              :title="t('dashboard.company.stats.cash')"
              :value="fmt(overview.cash)"
              icon="i-lucide-landmark"
            />
            <DashboardStatsCard
              :title="t('dashboard.company.stats.burn')"
              :value="fmt(overview.netBurn)"
              icon="i-lucide-flame"
            />
            <DashboardStatsCard
              :title="t('dashboard.company.stats.runway')"
              :value="runwayLabel(overview.runwayMonths)"
              icon="i-lucide-timer"
            />
            <DashboardStatsCard
              :title="t('dashboard.company.stats.waste')"
              :value="fmt(overview.subscriptionWaste)"
              icon="i-lucide-shield-alert"
            />
          </div>

          <div class="grid lg:grid-cols-3 gap-4">
            <UCard class="lg:col-span-1" :ui="{ body: 'p-6' }">
              <h2 class="font-display text-lg mb-4">{{ t('dashboard.company.monthlyBreakdown') }}</h2>
              <dl class="space-y-3 text-sm">
                <div class="flex justify-between gap-4">
                  <dt class="text-muted">{{ t('dashboard.company.income') }}</dt>
                  <dd class="font-medium text-green-600 tabular-nums">{{ fmt(overview.monthlyIncome) }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-muted">{{ t('dashboard.company.expenses') }}</dt>
                  <dd class="font-medium tabular-nums">{{ fmt(overview.monthlyBurn) }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-muted">{{ t('dashboard.company.subscriptions') }}</dt>
                  <dd class="font-medium tabular-nums">{{ fmt(overview.monthlySubscriptions) }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-muted">{{ t('dashboard.company.cloudDev') }}</dt>
                  <dd class="font-medium tabular-nums">{{ fmt(overview.cloudSpend) }}</dd>
                </div>
              </dl>
            </UCard>

            <UCard class="lg:col-span-1" :ui="{ body: 'p-6' }">
              <h2 class="font-display text-lg mb-2">{{ t('dashboard.company.saasShield') }}</h2>
              <p class="text-sm text-muted mb-4">
                {{ t('dashboard.company.activeSubs', { count: overview.activeSubscriptions }) }}
              </p>
              <p v-if="overview.subscriptionWaste > 0" class="text-sm text-amber-600 mb-4">
                {{ t('dashboard.company.duplicateWaste', { amount: fmt(overview.subscriptionWaste) }) }}
              </p>
              <UButton
                to="/dashboard/subscriptions"
                :label="t('dashboard.company.reviewSubs')"
                variant="outline"
                block
              />
            </UCard>

            <UCard class="lg:col-span-1" :ui="{ body: 'p-6' }">
              <h2 class="font-display text-lg mb-4">{{ t('dashboard.company.topVendors') }}</h2>
              <ul v-if="overview.topVendors.length" class="space-y-3 text-sm">
                <li
                  v-for="vendor in overview.topVendors"
                  :key="vendor.name"
                  class="flex justify-between gap-3"
                >
                  <span class="truncate text-muted">{{ vendor.name }}</span>
                  <span class="font-medium tabular-nums shrink-0">{{ fmt(vendor.amount) }}</span>
                </li>
              </ul>
              <p v-else class="text-sm text-muted">{{ t('dashboard.company.noVendors') }}</p>
            </UCard>
          </div>

          <p class="text-xs text-muted text-center pt-4">
            {{ t('dashboard.company.footnote') }}
          </p>
        </template>
      </template>
    </template>
  </div>
</template>
