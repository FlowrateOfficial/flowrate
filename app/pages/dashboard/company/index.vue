<script setup lang="ts">
// ANCHOR: Company page — burn rate, team, setup steps
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Business', middleware: 'auth', keepalive: true })

const route = useRoute()
const { t } = useAppI18n()
const spacesStore = useSpacesStore()
const businessStore = useBusinessStore()
const {
  tab,
  inviting,
  overview,
  overviewPending,
  teamMembers,
  teamPending,
  setupSteps
} = storeToRefs(businessStore)
const { isBusinessReadOnly, canManageBusiness } = storeToRefs(spacesStore)

useDashboardSeo('dashboard.company.title')

await useSpaceStoreFetch('business-overview', () => businessStore.fetchOverview())

watch(tab, (val) => {
  // NOTE - Team tab loads members lazily
  if (val === 'team') {
    businessStore.fetchTeam()
  }
}, { immediate: true })

onMounted(() => {
  if (route.query.tab === 'team') businessStore.tab = 'team'
})

watch(() => route.query.tab, (val) => {
  if (val === 'team') businessStore.tab = 'team'
  else if (val === 'overview') businessStore.tab = 'overview'
})

function refreshTeam() {
  return businessStore.fetchTeam(true)
}

const pending = overviewPending
</script>

<template>
  <DashboardPageShell max-width="6xl">
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

    <UCard v-if="spacesStore.space?.type !== 'COMPANY'" :ui="{ body: 'p-6 sm:p-8 text-center' }">
      <UIcon name="i-lucide-rocket" class="mx-auto mb-3 size-10 text-muted opacity-50" />
      <h2 class="mb-1 text-lg font-semibold">{{ t('dashboard.company.noBusinessTitle') }}</h2>
      <p class="mx-auto mb-4 max-w-md text-sm text-muted">{{ t('dashboard.company.switchHint') }}</p>
      <UButton to="/dashboard/spaces" :label="t('dashboard.company.createBusinessCta')" icon="i-lucide-plus" />
    </UCard>

    <template v-else>
      <UTabs v-if="canManageBusiness" v-model="tab" :items="businessStore.tabs" :content="false" class="mb-2" />

      <div v-if="tab === 'team' && canManageBusiness" class="space-y-4">
        <UCard :ui="{ body: 'p-4 sm:p-5' }">
          <h2 class="mb-1 text-base font-semibold">{{ t('dashboard.company.team.inviteTitle') }}</h2>
          <p class="mb-4 text-sm text-muted">{{ t('dashboard.company.team.inviteDesc') }}</p>

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
              <UInput v-model="businessStore.inviteForm.name" class="w-full" />
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
            class="mt-4"
            :label="t('dashboard.company.team.sendInvite')"
            icon="i-lucide-mail"
            :loading="inviting"
            @click="businessStore.inviteMember(() => refreshTeam())"
          />
        </UCard>

        <UCard :ui="{ body: 'p-0' }">
          <div class="border-b border-default px-4 py-3 sm:px-5">
            <h2 class="text-base font-semibold">{{ t('dashboard.company.team.membersTitle') }}</h2>
          </div>
          <div v-if="teamPending" class="p-6 text-center">
            <UIcon name="i-lucide-loader-2" class="mx-auto size-6 animate-spin text-muted" />
          </div>
          <ul v-else class="divide-y divide-default">
            <li
              v-for="member in teamMembers"
              :key="member.id"
              class="flex items-center justify-between gap-4 px-4 py-3 sm:px-5"
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
        <div v-if="pending" class="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
          <UCard v-for="i in 4" :key="i" :ui="{ body: 'p-3 sm:p-4' }">
            <div class="animate-pulse space-y-2">
              <div class="h-3.5 w-20 rounded-sm bg-elevated" />
              <div class="h-7 w-28 rounded-sm bg-elevated/70" />
            </div>
          </UCard>
        </div>

        <template v-else-if="overview">
          <UCard v-if="!overview.setup.complete" :ui="{ body: 'p-4 sm:p-5' }">
            <h2 class="mb-1 text-base font-semibold sm:text-lg">{{ t('dashboard.company.setup.title') }}</h2>
            <p class="mb-5 max-w-2xl text-sm text-muted">{{ t('dashboard.company.setup.subtitle') }}</p>

            <ol class="space-y-4">
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

          <div v-if="overview.alerts.length" class="space-y-2">
            <h2 class="text-base font-semibold">{{ t('dashboard.company.alertsTitle') }}</h2>
            <UAlert
              v-for="(alert, i) in overview.alerts"
              :key="`${alert.code}-${i}`"
              :description="businessStore.alertMessage(alert)"
              :color="alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'neutral'"
              variant="subtle"
              :icon="alert.severity === 'critical' ? 'i-lucide-alert-circle' : alert.severity === 'warning' ? 'i-lucide-triangle-alert' : 'i-lucide-info'"
            />
          </div>

          <div class="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
            <DashboardStatsCard
              :title="t('dashboard.company.stats.cash')"
              :value="businessStore.fmt(overview.cash)"
              icon="i-lucide-landmark"
            />
            <DashboardStatsCard
              :title="t('dashboard.company.stats.burn')"
              :value="businessStore.fmt(overview.netBurn)"
              icon="i-lucide-flame"
            />
            <DashboardStatsCard
              :title="t('dashboard.company.stats.runway')"
              :value="businessStore.runwayLabel(overview.runwayMonths)"
              icon="i-lucide-timer"
            />
            <DashboardStatsCard
              :title="t('dashboard.company.stats.waste')"
              :value="businessStore.fmt(overview.subscriptionWaste)"
              icon="i-lucide-shield-alert"
            />
          </div>

          <div class="grid gap-3 lg:grid-cols-3">
            <UCard class="lg:col-span-1" :ui="{ body: 'p-4 sm:p-5' }">
              <h2 class="mb-3 text-base font-semibold">{{ t('dashboard.company.monthlyBreakdown') }}</h2>
              <dl class="space-y-3 text-sm">
                <div class="flex justify-between gap-4">
                  <dt class="text-muted">{{ t('dashboard.company.income') }}</dt>
                  <dd class="font-medium text-green-600 tabular-nums">{{ businessStore.fmt(overview.monthlyIncome) }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-muted">{{ t('dashboard.company.expenses') }}</dt>
                  <dd class="font-medium tabular-nums">{{ businessStore.fmt(overview.monthlyBurn) }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-muted">{{ t('dashboard.company.subscriptions') }}</dt>
                  <dd class="font-medium tabular-nums">{{ businessStore.fmt(overview.monthlySubscriptions) }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-muted">{{ t('dashboard.company.cloudDev') }}</dt>
                  <dd class="font-medium tabular-nums">
                    {{ overview.cloudSpend != null ? businessStore.fmt(overview.cloudSpend) : '—' }}
                  </dd>
                </div>
              </dl>
            </UCard>

            <UCard class="lg:col-span-1" :ui="{ body: 'p-4 sm:p-5' }">
              <h2 class="mb-2 text-base font-semibold">{{ t('dashboard.company.saasShield') }}</h2>
              <p class="text-sm text-muted mb-4">
                {{ t('dashboard.company.activeSubs', { count: overview.activeSubscriptions }) }}
              </p>
              <p v-if="overview.subscriptionWaste > 0" class="text-sm text-amber-600 mb-4">
                {{ t('dashboard.company.duplicateWaste', { amount: businessStore.fmt(overview.subscriptionWaste) }) }}
              </p>
              <UButton
                to="/dashboard/subscriptions"
                :label="t('dashboard.company.reviewSubs')"
                variant="outline"
                block
              />
            </UCard>

            <UCard class="lg:col-span-2" :ui="{ body: 'p-4 sm:p-5' }">
              <h2 class="mb-3 text-base font-semibold">{{ t('dashboard.company.topVendors') }}</h2>
              <div class="grid gap-4 lg:grid-cols-2">
                <ul v-if="overview.topVendors.length" class="space-y-3 text-sm">
                  <li
                    v-for="vendor in overview.topVendors"
                    :key="vendor.name"
                    class="flex justify-between gap-3"
                  >
                    <span class="truncate text-muted">{{ vendor.name }}</span>
                    <span class="font-medium tabular-nums shrink-0">{{ businessStore.fmt(vendor.amount) }}</span>
                  </li>
                </ul>
                <p v-else class="text-sm text-muted">{{ t('dashboard.company.noVendors') }}</p>

                <div v-if="overview.vendorTrends?.length">
                  <p class="mb-2 text-xs font-medium text-muted">{{ t('dashboard.company.vendorTrends') }}</p>
                  <DashboardChartsVendorTrendChart
                    :trends="overview.vendorTrends"
                    :currency="overview.currency"
                  />
                </div>
              </div>
            </UCard>
          </div>

          <p class="text-center text-xs text-muted">
            {{ t('dashboard.company.footnote') }}
          </p>
        </template>
      </template>
    </template>
  </DashboardPageShell>
</template>
