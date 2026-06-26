<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { SPACE_TYPE_ICONS } from '~/types/space'

const { t } = useAppI18n()
const spacesStore = useSpacesStore()
const { activeSpace, spaces, loading } = storeToRefs(spacesStore)
const switching = ref(false)

onMounted(() => {
  if (!spaces.value.length) spacesStore.fetchSpaces()
})

async function onSwitch(spaceId: string) {
  if (spaceId === activeSpace.value?.id) return
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
    click: () => onSwitch(s.id)
  }))
)
</script>

<template>
  <UDropdownMenu :items="[items]" :disabled="loading || switching">
    <button
      class="w-full flex items-center gap-3 px-4 py-3 rounded-flow text-sm bg-flow-secondary/60 dark:bg-flow-secondary-dark/60 hover:bg-flow-secondary dark:hover:bg-flow-secondary-dark transition-all duration-300"
      :disabled="loading || switching"
    >
      <UIcon
        v-if="activeSpace"
        :name="SPACE_TYPE_ICONS[activeSpace.type]"
        class="w-4 h-4 text-sage shrink-0 stroke-[1.25]"
      />
      <div class="flex-1 min-w-0 text-left">
        <p class="truncate font-medium text-flow-ink dark:text-flow-ink-dark">{{ activeSpace?.name ?? t('common.loading') }}</p>
        <p v-if="activeSpace" class="text-xs text-flow-muted dark:text-flow-muted-dark truncate">
          {{ spacesStore.spaceType(activeSpace.type) }}
        </p>
      </div>
      <UIcon name="i-lucide-chevrons-up-down" class="w-3.5 h-3.5 text-flow-muted shrink-0 stroke-[1.25]" />
    </button>
  </UDropdownMenu>
</template>
