<script setup lang="ts">
import { formatCurrencyForLocale } from '~/utils/format'

definePageMeta({ layout: 'dashboard', title: 'Child', middleware: 'auth' })

const { t, getLocale } = useAppI18n()

const route = useRoute()
const { activeSpace } = useActiveSpace()
const memberId = route.params.memberId as string

const spaceId = computed(() => activeSpace.value?.id ?? '')

const form = reactive({
  allowanceAmount: 0,
  allowanceFrequency: 'WEEKLY' as 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  learnMode: true
})
const jarName = ref('')
const saving = ref(false)

const { data: spaceDetail, refresh } = await useFetch(() => `/api/spaces/${spaceId.value}`, {
  watch: [spaceId]
})

const member = computed(() => spaceDetail.value?.members?.find((m: { id: string }) => m.id === memberId))

const frequencyItems = computed(() => [
  { label: t('frequencies.WEEKLY'), value: 'WEEKLY' },
  { label: t('frequencies.MONTHLY'), value: 'MONTHLY' },
  { label: t('frequencies.YEARLY'), value: 'YEARLY' }
])

function roleLabel(role?: string) {
  if (!role) return ''
  const key = `roles.${role}`
  const translated = t(key)
  return translated !== key ? translated : role.toLowerCase()
}

watch(member, (m) => {
  if (m?.childProfile) {
    form.allowanceAmount = m.childProfile.allowanceAmount ?? 0
    form.allowanceFrequency = m.childProfile.allowanceFrequency ?? 'WEEKLY'
    form.learnMode = m.childProfile.learnMode
  }
}, { immediate: true })

async function saveProfile() {
  if (!spaceId.value) return
  saving.value = true
  try {
    await $fetch(`/api/spaces/${spaceId.value}/members/${memberId}/child`, {
      method: 'PATCH',
      body: form
    })
    await refresh()
  } finally {
    saving.value = false
  }
}

async function addJar() {
  if (!spaceId.value || !jarName.value) return
  await $fetch(`/api/spaces/${spaceId.value}/members/${memberId}/child`, {
    method: 'POST',
    body: { name: jarName.value }
  })
  jarName.value = ''
  await refresh()
}

function fmt(amount: number) {
  return formatCurrencyForLocale(amount, getLocale(), 'USD')
}
</script>

<template>
  <div class="p-6 max-w-xl mx-auto space-y-6">
    <div>
      <UButton
        to="/dashboard/family"
        icon="i-lucide-arrow-left"
        :label="t('common.back')"
        variant="ghost"
        color="neutral"
        size="sm"
      />
      <h1 class="text-2xl font-bold mt-2">{{ member?.name ?? t('dashboard.family.childFallback') }}</h1>
      <p class="text-sm text-muted">
        {{ t('dashboard.family.accountSuffix', { role: roleLabel(member?.role) }) }}
      </p>
    </div>

    <UCard>
      <template #header>
        <h2 class="font-semibold">{{ t('dashboard.family.child.title') }}</h2>
      </template>
      <div class="space-y-4">
        <UFormField :label="t('dashboard.family.child.allowanceAmount')">
          <UInput v-model.number="form.allowanceAmount" type="number" min="0" class="w-full" />
        </UFormField>
        <UFormField :label="t('dashboard.family.child.frequency')">
          <USelect v-model="form.allowanceFrequency" :items="frequencyItems" class="w-full" />
        </UFormField>
        <UCheckbox v-model="form.learnMode" :label="t('dashboard.family.child.learnMode')" />
        <UButton :label="t('common.save')" :loading="saving" @click="saveProfile" />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">{{ t('dashboard.family.child.jarsTitle') }}</h2>
      </template>
      <div class="space-y-3">
        <div v-for="jar in member?.childProfile?.jars" :key="jar.id" class="flex justify-between text-sm">
          <span>{{ jar.name }}</span>
          <span class="font-medium">{{ fmt(jar.balance) }}</span>
        </div>
        <div class="flex gap-2">
          <UInput v-model="jarName" :placeholder="t('dashboard.family.child.jarPlaceholder')" class="flex-1" />
          <UButton :label="t('common.add')" @click="addJar" />
        </div>
      </div>
    </UCard>
  </div>
</template>
