<script setup lang="ts">
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'
import {
  clearPlaidLinkSession,
  openPlaidLink,
  readPlaidLinkSession
} from '~/lib/plaid-link'

definePageMeta({ layout: 'dashboard', title: 'Connect bank', middleware: 'auth' })

const { t } = useAppI18n()
const route = useRoute()
const router = useRouter()
const { api } = useApi()
const appToast = useAppToast()

const failed = ref(false)
const pending = ref(true)

onMounted(async () => {
  const session = readPlaidLinkSession()
  if (!session) {
    appToast.errorMessage(t('dashboard.accounts.plaidOAuthMissingSession'))
    failed.value = true
    pending.value = false
    return
  }

  try {
    const oauthStateId = typeof route.query.oauth_state_id === 'string' ? route.query.oauth_state_id : null
    if (!oauthStateId) {
      appToast.errorMessage(t('dashboard.accounts.plaidOAuthInvalid'))
      failed.value = true
      pending.value = false
      return
    }

    const { publicToken, metadata } = await openPlaidLink({
      linkToken: session.linkToken,
      receivedRedirectUri: window.location.href
    })

    await api(apiRoutes.plaid.exchange, {
      method: 'POST',
      body: {
        publicToken,
        visibility: session.visibility,
        metadata
      }
    })

    clearPlaidLinkSession()
    await router.replace('/dashboard/accounts')
  } catch (error) {
    clearPlaidLinkSession()
    appToast.errorFrom(error, 'dashboard.accounts.connectError')
    failed.value = true
    pending.value = false
  }
})
</script>

<template>
  <DashboardPageShell max-width="md">
    <DashboardPageHeader
      :title="t('dashboard.accounts.plaidOAuthTitle')"
      back-to="/dashboard/accounts"
    />

    <UCard :ui="{ body: 'p-4 sm:p-5' }">
      <div
        v-if="pending && !failed"
        class="flex items-center gap-3"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="size-5 animate-spin text-muted"
        />
        <p class="text-sm text-muted">
          {{ t('dashboard.accounts.plaidOAuthPending') }}
        </p>
      </div>
      <div v-else-if="failed">
        <UButton
          :label="t('dashboard.accounts.plaidOAuthBack')"
          to="/dashboard/accounts"
          color="neutral"
          variant="outline"
        />
      </div>
    </UCard>
  </DashboardPageShell>
</template>
