<script setup lang="ts">
// ANCHOR: Spaces page — list and create financial spaces
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

useDashboardSeo('dashboard.spaces.title')

onMounted(() => spacesStore.fetchSpaces())
</script>

<template>
  <DashboardPageShell max-width="lg">
    <DashboardPageHeader
      :title="t('dashboard.spaces.title')"
      :description="t('dashboard.spaces.subtitle')"
    >
      <template #actions>
        <UButton
          v-if="spacesStore.canCreateSharedSpace"
          :label="t('dashboard.spaces.newSpace')"
          icon="i-lucide-plus"
          @click="showCreate = true"
        />
      </template>
    </DashboardPageHeader>

    <div class="grid gap-3">
      <UCard
        v-for="space in spaces"
        :key="space.id"
        class="cursor-pointer transition-all hover:ring-1 hover:ring-primary/30"
        :ui="{ body: 'p-4' }"
        @click="spacesStore.switchSpace(space.id)"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <UIcon :name="SPACE_TYPE_ICONS[space.type]" class="size-5 text-primary" />
            </div>
            <div class="min-w-0">
              <p class="truncate font-semibold">{{ space.name }}</p>
              <p class="text-sm text-muted">
                {{ spacesStore.spaceType(space.type) }} · {{ spacesStore.roleLabel(space.role) }}
              </p>
            </div>
          </div>
          <div class="shrink-0 text-right text-xs text-muted sm:text-sm">
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
              <div v-if="!spaceTypes.length" class="rounded-lg border border-dashed border-default p-4 text-center">
              <p class="text-sm text-muted">{{ t('dashboard.spaces.upgradeForShared') }}</p>
              <UButton
                class="mt-3"
                :label="t('dashboard.spaces.upgradeCta')"
                to="/dashboard/settings?tab=billing"
                size="sm"
              />
            </div>
            <div v-else class="grid gap-2">
                <UButton
                  v-for="st in spaceTypes"
                  :key="st.value"
                  type="button"
                  color="neutral"
                  :variant="createForm.type === st.value ? 'soft' : 'ghost'"
                  class="h-auto justify-start p-3"
                  @click="createForm.type = st.value"
                >
                  <div class="flex w-full items-start gap-3 text-left">
                    <UIcon :name="st.icon" class="mt-0.5 size-5 shrink-0 text-primary" />
                    <div>
                      <p class="text-sm font-medium">{{ st.label }}</p>
                      <p class="text-xs font-normal text-muted">{{ st.description }}</p>
                    </div>
                  </div>
                </UButton>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="showCreate = false" />
              <UButton :label="t('common.create')" :loading="creating" :disabled="!spaceTypes.length" @click="() => void spacesStore.createSpace()" />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </DashboardPageShell>
</template>
