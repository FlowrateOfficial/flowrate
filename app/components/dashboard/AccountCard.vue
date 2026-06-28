<script setup lang="ts">
import { formatCurrencyForLocale } from '~/utils/format'

interface Account {
  id: string
  name: string
  institution?: string | null
  type: string
  balance: number
  currency: string
  lastSynced?: string | null
  visibility?: 'PERSONAL' | 'SHARED'
  ownerName?: string | null
  isMine?: boolean
}

const props = defineProps<{ account: Account }>()

const { t, getLocale } = useAppI18n()
const accountsStore = useAccountsStore()
const disconnecting = ref(false)

async function disconnect() {
  if (!confirm(t('dashboard.accounts.disconnectConfirm'))) return
  disconnecting.value = true
  try {
    await accountsStore.disconnectAccount(props.account.id)
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
  return formatCurrencyForLocale(balance, getLocale(), currency)
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
  <UCard class="editorial-card-flat !p-5">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <UIcon :name="typeIcons[account.type] ?? 'i-lucide-landmark'" class="w-5 h-5 text-flow-muted stroke-[1.25]" />
        <div>
          <p class="font-medium text-sm">{{ account.name }}</p>
          <p v-if="account.institution" class="text-xs text-muted">{{ account.institution }}</p>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <UBadge :label="typeLabel(account.type)" color="neutral" variant="subtle" size="xs" />
        <UButton
          v-if="account.isMine !== false"
          icon="i-lucide-unlink"
          color="neutral"
          variant="ghost"
          size="xs"
          :loading="disconnecting"
          :aria-label="t('dashboard.accounts.disconnect')"
          @click="disconnect"
        />
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 mb-3">
      <UBadge
        v-if="account.visibility"
        :label="account.visibility === 'SHARED' ? t('dashboard.accounts.shared') : t('dashboard.accounts.personal')"
        :color="account.visibility === 'SHARED' ? 'primary' : 'neutral'"
        variant="subtle"
        size="xs"
      />
      <UBadge
        v-if="account.ownerName && !account.isMine"
        :label="account.ownerName"
        color="neutral"
        variant="outline"
        size="xs"
      />
    </div>

    <p class="text-2xl font-light tracking-tight tabular-nums">
      {{ fmt(account.balance, account.currency) }}
    </p>

    <p v-if="account.lastSynced" class="text-xs text-muted mt-2 flex items-center gap-1">
      <UIcon name="i-lucide-refresh-cw" class="w-3 h-3" />
      {{ t('dashboard.accounts.synced', { time: formatSynced(account.lastSynced) }) }}
    </p>
    <p v-else class="text-xs text-muted mt-2">
      {{ t('dashboard.accounts.notSynced') }}
    </p>
  </UCard>
</template>
