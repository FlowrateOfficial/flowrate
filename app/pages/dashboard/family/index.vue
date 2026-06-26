<script setup lang="ts">
import { formatCurrencyForLocale } from '~/utils/format'

definePageMeta({ layout: 'dashboard', title: 'Family', middleware: 'auth' })

const { t, getLocale } = useAppI18n()
useSeoMeta({ title: () => `${t('dashboard.family.title')} — ${t('common.appName')}` })

const { activeSpace } = useActiveSpace()
const route = useRoute()
const spaceId = computed(() => activeSpace.value?.id ?? (route.query.spaceId as string))

const { data: spaceDetail, refresh } = await useFetch(() => `/api/spaces/${spaceId.value}`, {
  watch: [spaceId]
})

const inviteForm = reactive({ email: '', role: 'CO_GUARDIAN' as string, displayName: '' })
const childForm = reactive({ email: '', displayName: '', role: 'CHILD' as 'CHILD' | 'TEEN', dateOfBirth: '' })
const inviting = ref(false)
const tab = ref('members')

const tabs = computed(() => [
  { label: t('dashboard.family.tabs.members'), value: 'members' },
  { label: t('dashboard.family.tabs.children'), value: 'children' },
  { label: t('dashboard.family.tabs.splits'), value: 'splits' }
])

const childRoleItems = computed(() => [
  { label: t('dashboard.family.roleChild'), value: 'CHILD' },
  { label: t('dashboard.family.roleTeen'), value: 'TEEN' }
])

function roleLabel(role: string) {
  const key = `roles.${role}`
  const translated = t(key)
  return translated !== key ? translated : role.toLowerCase().replace('_', ' ')
}

function statusLabel(status: string) {
  const key = `memberStatus.${status}`
  const translated = t(key)
  return translated !== key ? translated : status
}

function fmtAllowance(amount: number, frequency?: string | null) {
  const freq = frequency ? t(`frequencies.${frequency}`).toLowerCase() : ''
  return t('dashboard.family.allowance', {
    amount: formatCurrencyForLocale(amount, getLocale(), 'USD') + (freq ? `/${freq}` : '')
  })
}

async function inviteMember() {
  if (!spaceId.value) return
  inviting.value = true
  try {
    await $fetch(`/api/spaces/${spaceId.value}/members`, {
      method: 'POST',
      body: {
        email: inviteForm.email,
        role: inviteForm.role,
        displayName: inviteForm.displayName || undefined
      }
    })
    inviteForm.email = ''
    inviteForm.displayName = ''
    await refresh()
  } finally {
    inviting.value = false
  }
}

async function addChild() {
  if (!spaceId.value) return
  inviting.value = true
  try {
    const body: Record<string, string> = {
      email: childForm.email || `${childForm.displayName.toLowerCase().replace(/\s/g, '')}@family.local`,
      role: childForm.role,
      displayName: childForm.displayName
    }
    if (childForm.dateOfBirth) body.dateOfBirth = new Date(childForm.dateOfBirth).toISOString()
    await $fetch(`/api/spaces/${spaceId.value}/members`, { method: 'POST', body })
    childForm.displayName = ''
    childForm.email = ''
    childForm.dateOfBirth = ''
    await refresh()
  } finally {
    inviting.value = false
  }
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold">{{ t('dashboard.family.title') }}</h1>
      <p class="text-sm text-muted mt-1">{{ t('dashboard.family.subtitle') }}</p>
    </div>

    <UTabs v-model="tab" :items="tabs" />

    <div v-if="tab === 'members'" class="space-y-4">
      <UCard>
        <template #header>
          <h2 class="font-semibold">{{ t('dashboard.family.inviteGuardian') }}</h2>
        </template>
        <div class="grid sm:grid-cols-2 gap-3">
          <UInput v-model="inviteForm.email" type="email" :placeholder="t('dashboard.family.emailPlaceholder')" />
          <UInput v-model="inviteForm.displayName" :placeholder="t('dashboard.family.displayNamePlaceholder')" />
        </div>
        <UButton class="mt-3" :label="t('dashboard.family.sendInvite')" :loading="inviting" @click="inviteMember" />
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold">{{ t('dashboard.family.membersTitle') }}</h2>
        </template>
        <div class="divide-y divide-default">
          <div
            v-for="m in spaceDetail?.members"
            :key="m.id"
            class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
          >
            <div>
              <p class="font-medium">{{ m.name ?? m.email }}</p>
              <p class="text-xs text-muted">{{ roleLabel(m.role) }}</p>
            </div>
            <UBadge :label="statusLabel(m.status)" size="sm" variant="subtle" />
          </div>
        </div>
      </UCard>
    </div>

    <div v-else-if="tab === 'children'" class="space-y-4">
      <UCard>
        <template #header>
          <h2 class="font-semibold">{{ t('dashboard.family.addChildTitle') }}</h2>
          <p class="text-sm text-muted">{{ t('dashboard.family.addChildDescription') }}</p>
        </template>
        <div class="space-y-3">
          <UInput v-model="childForm.displayName" :placeholder="t('dashboard.family.childName')" />
          <UInput v-model="childForm.email" type="email" :placeholder="t('dashboard.family.teenEmail')" />
          <UInput v-model="childForm.dateOfBirth" type="date" />
          <USelect v-model="childForm.role" :items="childRoleItems" />
          <UButton :label="t('common.add')" :loading="inviting" @click="addChild" />
        </div>
      </UCard>

      <div class="grid gap-4">
        <UCard
          v-for="m in spaceDetail?.members?.filter(x => x.role === 'CHILD' || x.role === 'TEEN')"
          :key="m.id"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">{{ m.name }}</p>
              <p class="text-sm text-muted">
                {{ m.role === 'TEEN' ? t('dashboard.family.teenAccount') : t('dashboard.family.guardianManaged') }}
              </p>
            </div>
            <NuxtLink :to="`/dashboard/family/${m.id}`">
              <UButton :label="t('common.manage')" size="xs" variant="subtle" />
            </NuxtLink>
          </div>
          <div v-if="m.childProfile" class="mt-3 text-sm text-muted">
            {{
              m.childProfile.allowanceAmount
                ? fmtAllowance(m.childProfile.allowanceAmount, m.childProfile.allowanceFrequency)
                : t('dashboard.family.allowanceNotSet')
            }}
            · {{ t('dashboard.family.savingsJars', { count: m.childProfile.jars?.length ?? 0 }) }}
          </div>
        </UCard>
      </div>
    </div>

    <div v-else class="text-sm text-muted">
      <p>{{ t('dashboard.family.splitsHint') }}</p>
      <UButton to="/dashboard/spaces" :label="t('dashboard.spaces.manageSpaces')" class="mt-3" variant="subtle" />
    </div>
  </div>
</template>
