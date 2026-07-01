<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { SPACE_TYPE_ICONS } from '~/types/space'

const { t } = useAppI18n()
const spacesStore = useSpacesStore()
const { space, spaces, loading, switching } = storeToRefs(spacesStore)
const { open, closeMenu } = useMobileSpaceMenu()

async function selectSpace(spaceId: string) {
  if (spaceId === space.value?.id || switching.value) return
  await spacesStore.switchSpace(spaceId)
  closeMenu()
}

async function goToSpaces() {
  closeMenu()
  await navigateTo('/dashboard/spaces')
}
</script>

<template>
  <USlideover
    v-model:open="open"
    side="bottom"
    :title="t('dashboard.layout.switchSpace')"
    :ui="{ content: 'max-h-[85dvh] rounded-t-2xl' }"
  >
    <template #body>
      <div class="space-y-4 pb-4">
        <p class="text-sm text-muted">
          {{ t('dashboard.layout.switchSpaceHint') }}
        </p>

        <div class="flex flex-col gap-2">
          <button
            v-for="item in spaces"
            :key="item.id"
            type="button"
            class="flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
            :class="item.id === space?.id
              ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
              : 'border-default bg-elevated/30 hover:bg-elevated/60'"
            :disabled="loading || switching"
            @click="selectSpace(item.id)"
          >
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-lg"
              :class="item.id === space?.id ? 'bg-primary/15' : 'bg-elevated'"
            >
              <UIcon
                :name="SPACE_TYPE_ICONS[item.type]"
                class="size-5"
                :class="item.id === space?.id ? 'text-primary' : 'text-muted'"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold">
                {{ item.name }}
              </p>
              <p class="truncate text-sm text-muted">
                {{ spacesStore.spaceType(item.type) }} · {{ spacesStore.roleLabel(item.role) }}
              </p>
            </div>
            <UIcon
              v-if="item.id === space?.id"
              name="i-lucide-check"
              class="size-5 shrink-0 text-primary"
            />
          </button>
        </div>

        <UButton
          v-if="!spacesStore.isMinor"
          :label="t('dashboard.spaces.manageSpaces')"
          icon="i-lucide-layers"
          color="neutral"
          variant="outline"
          block
          size="lg"
          class="min-h-12"
          @click="goToSpaces"
        />
      </div>
    </template>
  </USlideover>
</template>
