<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { SPACE_TYPE_ICONS } from '~/types/space'

const { t } = useAppI18n()
const spacesStore = useSpacesStore()
const { space, spaces, loading } = storeToRefs(spacesStore)
const switching = ref(false)

async function onSwitch(spaceId: string) {
  if (spaceId === space.value?.id) return
  switching.value = true
  try {
    await spacesStore.switchSpace(spaceId)
  } finally {
    switching.value = false
  }
}

const items = computed(() =>
  spaces.value.map(s => ({
    label: s.name,
    description: spacesStore.spaceType(s.type),
    icon: SPACE_TYPE_ICONS[s.type],
    onSelect: () => onSwitch(s.id)
  }))
)
</script>

<template>
  <UDropdownMenu :items="[items]" :disabled="loading || switching">
    <UButton
      color="neutral"
      variant="outline"
      block
      size="lg"
      class="min-h-12 justify-start gap-3 px-4"
      :loading="loading || switching"
      :disabled="loading || switching"
    >
      <UIcon
        v-if="space"
        :name="SPACE_TYPE_ICONS[space.type]"
        class="size-5 shrink-0 text-primary"
      />
      <span class="min-w-0 flex-1 text-left">
        <span class="block truncate text-base font-semibold">
          {{ space?.name ?? t('common.loading') }}
        </span>
        <span v-if="space" class="block truncate text-sm text-muted">
          {{ spacesStore.spaceType(space.type) }}
        </span>
      </span>
      <UIcon name="i-lucide-chevrons-up-down" class="size-4 shrink-0 text-muted" />
    </UButton>
  </UDropdownMenu>
</template>
