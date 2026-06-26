<script setup lang="ts">
definePageMeta({ layout: 'dashboard', title: 'Settings', middleware: 'auth' })

const { t } = useAppI18n()
useSeoMeta({ title: () => `${t('dashboard.settings.title')} — ${t('common.appName')}` })

const { getSession } = useNeonAuth()

const authUser = ref<{ id: string; name: string | null; email: string } | null>(null)
const userPlan = ref<'FREE' | 'PRO' | 'ENTERPRISE'>('FREE')

onMounted(async () => {
  const session = await getSession()
  authUser.value = session?.user ?? null
  if (authUser.value) {
    profile.name = authUser.value.name ?? ''
    profile.email = authUser.value.email
  }
  const data = await $fetch<{ plan: 'FREE' | 'PRO' | 'ENTERPRISE' }>('/api/user/profile')
    .catch(() => null)
  if (data?.plan) userPlan.value = data.plan
})

const profile = reactive({
  name: '',
  email: ''
})

const isSavingProfile = ref(false)
const profileSaved = ref(false)

async function saveProfile() {
  isSavingProfile.value = true
  profileSaved.value = false
  try {
    await $fetch('/api/user/profile', {
      method: 'PATCH',
      body: { name: profile.name }
    })
    profileSaved.value = true
    setTimeout(() => { profileSaved.value = false }, 3000)
  } finally {
    isSavingProfile.value = false
  }
}

const isLoadingPortal = ref(false)

async function openBillingPortal() {
  isLoadingPortal.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/stripe/billing-portal', {
      method: 'POST'
    })
    window.location.href = url
  } finally {
    isLoadingPortal.value = false
  }
}

const planLabels = computed(() => ({
  FREE: { label: t('dashboard.settings.plans.FREE'), color: 'neutral' as const },
  PRO: { label: t('dashboard.settings.plans.PRO'), color: 'primary' as const },
  ENTERPRISE: { label: t('dashboard.settings.plans.ENTERPRISE'), color: 'success' as const }
}))
</script>

<template>
  <div class="p-6 space-y-8 max-w-2xl mx-auto">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">{{ t('dashboard.settings.title') }}</h1>
      <p class="text-sm text-muted mt-1">{{ t('dashboard.settings.subtitle') }}</p>
    </div>

    <UCard>
      <template #header>
        <h2 class="font-semibold">{{ t('dashboard.settings.profile') }}</h2>
      </template>

      <div class="space-y-4">
        <UAlert
          v-if="profileSaved"
          :description="t('dashboard.settings.profileSaved')"
          color="success"
          variant="subtle"
          icon="i-lucide-check-circle"
        />

        <UFormField :label="t('dashboard.settings.fullName')">
          <UInput v-model="profile.name" :placeholder="t('dashboard.settings.namePlaceholder')" class="w-full" />
        </UFormField>

        <UFormField :label="t('dashboard.settings.email')">
          <UInput
            v-model="profile.email"
            type="email"
            class="w-full"
            disabled
            :ui="{ base: 'opacity-60 cursor-not-allowed' }"
          />
          <template #help>
            {{ t('dashboard.settings.emailHelp') }}
          </template>
        </UFormField>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton
            :label="t('dashboard.settings.saveChanges')"
            :loading="isSavingProfile"
            @click="saveProfile"
          />
        </div>
      </template>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">{{ t('dashboard.settings.planBilling') }}</h2>
          <UBadge
            :label="planLabels[userPlan]?.label ?? t('dashboard.settings.plans.FREE')"
            :color="planLabels[userPlan]?.color ?? 'neutral'"
            variant="subtle"
          />
        </div>
      </template>

      <div class="space-y-4">
        <div v-if="userPlan === 'FREE'">
          <p class="text-sm text-muted mb-4">
            {{ t('dashboard.settings.upgradeDescription') }}
          </p>
          <UButton
            to="/auth/register?plan=pro"
            :label="t('dashboard.settings.upgradeCta')"
            icon="i-lucide-sparkles"
          />
        </div>

        <div v-else>
          <p class="text-sm text-muted mb-4">
            {{ t('dashboard.settings.manageDescription') }}
          </p>
          <UButton
            :label="t('dashboard.settings.billingPortal')"
            icon="i-lucide-external-link"
            color="neutral"
            variant="subtle"
            :loading="isLoadingPortal"
            @click="openBillingPortal"
          />
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">{{ t('dashboard.settings.connectedServices') }}</h2>
      </template>

      <div class="divide-y divide-default">
        <div class="flex items-center justify-between py-3 first:pt-0">
          <div class="flex items-center gap-3">
            <UIcon name="i-simple-icons-github" class="w-5 h-5 text-foreground" />
            <div>
              <p class="text-sm font-medium">{{ t('dashboard.settings.github') }}</p>
              <p class="text-xs text-muted">{{ t('dashboard.settings.githubDescription') }}</p>
            </div>
          </div>
          <UButton :label="t('dashboard.settings.connect')" size="xs" color="neutral" variant="subtle" />
        </div>

        <div class="flex items-center justify-between py-3">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-cloud" class="w-5 h-5 text-foreground" />
            <div>
              <p class="text-sm font-medium">{{ t('dashboard.settings.cloud') }}</p>
              <p class="text-xs text-muted">{{ t('dashboard.settings.cloudDescription') }}</p>
            </div>
          </div>
          <UButton :label="t('dashboard.settings.connect')" size="xs" color="neutral" variant="subtle" />
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold text-error">{{ t('dashboard.settings.dangerZone') }}</h2>
      </template>

      <div class="space-y-3">
        <p class="text-sm text-muted">
          {{ t('dashboard.settings.deleteWarning') }}
        </p>
        <UButton
          :label="t('dashboard.settings.deleteAccount')"
          color="error"
          variant="subtle"
          icon="i-lucide-trash-2"
        />
      </div>
    </UCard>
  </div>
</template>
