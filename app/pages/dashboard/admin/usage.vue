<script setup lang="ts">
import type { AdminUsageTotals, AdminUsageRow } from '~/types/admin'
import { useApi } from '~/lib/api/useApi'

definePageMeta({ layout: 'dashboard', title: 'Usage', middleware: 'auth' })

const { t } = useAppI18n()
const { api } = useApi()

type AdminUsageResponse = { totals: AdminUsageTotals, rows: AdminUsageRow[] }

const { data, error, pending, refresh } = await useAsyncData<AdminUsageResponse>(
  'admin-usage',
  () => api<AdminUsageResponse>('/api/admin/usage', { noSpace: true })
)

const appToast = useAppToast()

watch(error, (value) => {
  if (value) {
    appToast.error(
      'Admin access required',
      'Set ADMIN_EMAILS in your environment to your login email.'
    )
  }
}, { immediate: true })

useSeoMeta({ title: () => `Admin usage — ${t('common.appName')}` })

function formatWhen(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(iso))
}
</script>

<template>
  <DashboardPageShell max-width="full">
    <DashboardPageHeader
      title="Platform usage"
      description="Per-user bank links, sync volume, and data footprint — for infra planning."
    >
      <template #actions>
        <UButton
          label="Refresh"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          size="sm"
          :loading="pending"
          @click="refresh()"
        />
      </template>
    </DashboardPageHeader>

    <UEmpty
      v-if="error"
      icon="i-lucide-shield-alert"
      title="Admin access required"
      description="Set ADMIN_EMAILS in your environment to your login email."
      variant="naked"
    />

    <template v-else-if="data">
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <UCard
          v-for="item in [
            { label: 'Users', value: data.totals.users },
            { label: 'Paid', value: data.totals.paidUsers },
            { label: 'Bank links', value: data.totals.bankConnections },
            { label: 'Accounts', value: data.totals.accounts },
            { label: 'Transactions', value: data.totals.transactions },
            { label: 'Syncs (mo)', value: data.totals.syncsThisMonth }
          ]"
          :key="item.label"
          :ui="{ body: 'p-3 sm:p-4' }"
        >
          <p class="text-xs text-muted">
            {{ item.label }}
          </p>
          <p class="text-xl font-semibold tabular-nums">
            {{ item.value }}
          </p>
        </UCard>
      </div>

      <UCard :ui="{ body: 'p-0' }">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="border-b border-default bg-elevated/50 text-left text-xs text-muted">
              <tr>
                <th class="px-4 py-3 font-medium">
                  User
                </th>
                <th class="px-4 py-3 font-medium">
                  Plan
                </th>
                <th class="px-4 py-3 font-medium">
                  Banks
                </th>
                <th class="px-4 py-3 font-medium">
                  Accounts
                </th>
                <th class="px-4 py-3 font-medium">
                  Txns
                </th>
                <th class="px-4 py-3 font-medium">
                  Syncs/mo
                </th>
                <th class="px-4 py-3 font-medium">
                  Last sync
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr
                v-for="row in data.rows"
                :key="row.userId"
              >
                <td class="px-4 py-3">
                  <p class="font-medium">
                    {{ row.name ?? row.email }}
                  </p>
                  <p class="text-xs text-muted">
                    {{ row.email }}
                  </p>
                </td>
                <td class="px-4 py-3">
                  <UBadge
                    :label="row.plan"
                    color="neutral"
                    variant="subtle"
                    size="xs"
                  />
                </td>
                <td class="px-4 py-3 tabular-nums">
                  {{ row.bankConnections }}
                </td>
                <td class="px-4 py-3 tabular-nums">
                  {{ row.accountCount }}
                </td>
                <td class="px-4 py-3 tabular-nums">
                  {{ row.transactionCount }}
                </td>
                <td class="px-4 py-3 tabular-nums">
                  {{ row.syncsThisMonth }}
                </td>
                <td class="px-4 py-3 text-muted">
                  {{ formatWhen(row.lastSyncAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </template>
  </DashboardPageShell>
</template>
