<script setup lang="ts">
interface Account {
  id: string
  name: string
  institution?: string | null
  type: string
  balance: number
  currency: string
  syncedAt?: string | null
  visibility?: 'PERSONAL' | 'SHARED'
  ownerName?: string | null
  isMine?: boolean
}

const props = defineProps<{ account: Account }>()

const { t, formatCurrency } = useAppI18n()
const accountsStore = useAccountsStore()
const disconnecting = ref(false)
const disconnectOpen = ref(false)

async function disconnect() {
  disconnecting.value = true
  try {
    await accountsStore.disconnectAccount(props.account.id)
    disconnectOpen.value = false
  } finally {
    disconnecting.value = false
  }
}

const typeIcons: Record<string, string> = {
  CHECKING: 'i-lucide-landmark',
  SAVINGS: 'i-lucide-piggy-bank',
  CREDIT: 'i-lucide-credit-card',
  INVESTMENT: 'i-lucide-trending-up',
  CRYPTO: 'i-lucide-bitcoin',
  CLOUD: 'i-lucide-cloud'
}

function typeLabel(type: string) {
  const key = `accountTypes.${type}`
  const translated = t(key)
  return translated !== key ? translated : type.charAt(0) + type.slice(1).toLowerCase()
}

function fmt(balance: number, currency: string): string {
  return formatCurrency(balance, currency)
}

function formatSynced(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t('dashboard.accounts.syncedJustNow')
  if (mins < 60) return t('dashboard.accounts.syncedMinutes', { count: mins })
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return t('dashboard.accounts.syncedHours', { count: hrs })
  return t('dashboard.accounts.syncedDays', { count: Math.floor(hrs / 24) })
}
</script>

<template>
  <UCard :ui="{ body: 'p-5 sm:p-6' }">
    <div class="mb-4 flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <div class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-elevated">
          <UIcon :name="typeIcons[account.type] ?? 'i-lucide-landmark'" class="size-6 text-muted" />
        </div>
        <div class="min-w-0">
          <p class="truncate text-lg font-semibold">{{ account.name }}</p>
          <p v-if="account.institution" class="truncate text-sm text-muted">{{ account.institution }}</p>
        </div>
      </div>
      <UButton
        v-if="account.isMine !== false"
        icon="i-lucide-unlink"
        color="neutral"
        variant="ghost"
        size="md"
        :loading="disconnecting"
        :aria-label="t('dashboard.accounts.disconnect')"
        @click="disconnectOpen = true"
      />
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <UBadge :label="typeLabel(account.type)" color="neutral" variant="subtle" size="md" />
      <UBadge
        v-if="account.visibility"
        :label="account.visibility === 'SHARED' ? t('dashboard.accounts.shared') : t('dashboard.accounts.personal')"
        :color="account.visibility === 'SHARED' ? 'primary' : 'neutral'"
        variant="subtle"
        size="md"
      />
      <UBadge
        v-if="account.ownerName && !account.isMine"
        :label="account.ownerName"
        color="neutral"
        variant="outline"
        size="md"
      />
    </div>

    <p class="text-3xl font-semibold tabular-nums tracking-tight">
      {{ fmt(account.balance, account.currency) }}
    </p>

    <p v-if="account.syncedAt" class="mt-3 flex items-center gap-2 text-sm text-muted">
      <UIcon name="i-lucide-refresh-cw" class="size-4" />
      {{ t('dashboard.accounts.synced', { time: formatSynced(account.syncedAt) }) }}
    </p>
    <p v-else class="mt-3 text-sm text-muted">
      {{ t('dashboard.accounts.notSynced') }}
    </p>
  </UCard>

  <UModal
    v-model:open="disconnectOpen"
    :title="t('dashboard.accounts.disconnectTitle')"
    :description="t('dashboard.accounts.disconnectConfirm')"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="t('common.cancel')"
          color="neutral"
          variant="ghost"
          size="lg"
          @click="disconnectOpen = false"
        />
        <UButton
          :label="t('dashboard.accounts.disconnect')"
          color="error"
          size="lg"
          :loading="disconnecting"
          @click="disconnect"
        />
      </div>
    </template>
  </UModal>
</template>
