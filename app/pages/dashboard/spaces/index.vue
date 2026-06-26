<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { SPACE_TYPE_ICONS } from '~/types/space'

definePageMeta({ layout: 'dashboard', title: 'Spaces', middleware: 'auth' })

const { t } = useAppI18n()
const spacesStore = useSpacesStore()
const {
  spaces,
  creating,
  showCreate,
  createForm,
  spaceTypes
} = storeToRefs(spacesStore)

useSeoMeta({ title: () => `${t('dashboard.spaces.title')} — ${t('common.appName')}` })

onMounted(() => spacesStore.fetchSpaces())
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t('dashboard.spaces.title') }}</h1>
        <p class="text-sm text-muted mt-1">{{ t('dashboard.spaces.subtitle') }}</p>
      </div>
      <UButton :label="t('dashboard.spaces.newSpace')" icon="i-lucide-plus" @click="showCreate = true" />
    </div>

    <div class="grid gap-4">
      <UCard
        v-for="space in spaces"
        :key="space.id"
        class="cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all"
        @click="spacesStore.switchSpace(space.id)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UIcon :name="SPACE_TYPE_ICONS[space.type]" class="w-5 h-5 text-primary" />
            </div>
            <div>
              <p class="font-semibold">{{ space.name }}</p>
              <p class="text-sm text-muted">
                {{ spacesStore.spaceType(space.type) }} · {{ spacesStore.roleLabel(space.role) }}
              </p>
            </div>
          </div>
          <div class="text-right text-sm text-muted">
            <p>{{ t('dashboard.spaces.members', { count: space.memberCount }) }}</p>
            <p>{{ t('dashboard.spaces.accountCount', { count: space.accountCount ?? 0 }) }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <UModal v-model:open="showCreate">
      <template #content>
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">{{ t('dashboard.spaces.createTitle') }}</h2>
          </template>

          <div class="space-y-4">
            <UFormField :label="t('dashboard.spaces.nameLabel')">
              <UInput v-model="createForm.name" :placeholder="t('dashboard.spaces.namePlaceholder')" class="w-full" />
            </UFormField>

            <div class="space-y-2">
              <p class="text-sm font-medium">{{ t('dashboard.spaces.typeLabel') }}</p>
              <div class="grid gap-2">
                <UButton
                  v-for="st in spaceTypes"
                  :key="st.value"
                  type="button"
                  color="neutral"
                  :variant="createForm.type === st.value ? 'soft' : 'ghost'"
                  class="justify-start h-auto p-3"
                  @click="createForm.type = st.value"
                >
                  <div class="flex items-start gap-3 text-left w-full">
                    <UIcon :name="st.icon" class="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p class="font-medium text-sm">{{ st.label }}</p>
                      <p class="text-xs text-muted font-normal">{{ st.description }}</p>
                    </div>
                  </div>
                </UButton>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="showCreate = false" />
              <UButton :label="t('common.create')" :loading="creating" @click="spacesStore.createSpace" />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
