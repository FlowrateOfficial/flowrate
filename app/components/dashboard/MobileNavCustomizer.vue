<script setup lang="ts">
import { MOBILE_NAV_SLOT_COUNT } from '~/composables/useMobileNavLayout'

const { t } = useAppI18n()
const { open, closeCustomizer } = useMobileNavCustomizer()
const {
  order,
  availableItems,
  resetOrder,
  moveItem,
  replaceItem
} = useMobileNavLayout()

const selectedSlot = ref(0)

const poolItems = computed(() => {
  const active = new Set(order.value)
  return availableItems.value.filter(item => !active.has(item.to))
})

function itemForPath(to: string) {
  return availableItems.value.find(item => item.to === to)
}

function selectSlot(index: number) {
  selectedSlot.value = index
}

function addToSelected(to: string) {
  replaceItem(selectedSlot.value, to)
}

function onReset() {
  resetOrder()
  selectedSlot.value = 0
}
</script>

<template>
  <USlideover
    v-model:open="open"
    side="bottom"
    :title="t('dashboard.layout.customizeFooter')"
    :ui="{ content: 'max-h-[85dvh] rounded-t-2xl' }"
  >
    <template #body>
      <div class="space-y-5 pb-4">
        <p class="text-sm text-muted leading-relaxed">
          {{ t('dashboard.layout.customizeFooterHint', { count: MOBILE_NAV_SLOT_COUNT }) }}
        </p>

        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">
            {{ t('dashboard.layout.footerTabs') }}
          </p>
          <div
            v-for="(to, index) in order"
            :key="`${to}-${index}`"
            class="flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors"
            :class="selectedSlot === index ? 'border-primary/40 bg-primary/5' : 'border-default bg-elevated/20'"
          >
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-3 text-left"
              @click="selectSlot(index)"
            >
              <UIcon
                v-if="itemForPath(to)"
                :name="itemForPath(to)!.icon"
                class="size-5 shrink-0 text-primary"
              />
              <span class="min-w-0 truncate text-sm font-medium">
                {{ itemForPath(to)?.label ?? to }}
              </span>
            </button>
            <div class="flex shrink-0 items-center gap-0.5">
              <UButton
                icon="i-lucide-chevron-up"
                color="neutral"
                variant="ghost"
                size="xs"
                :disabled="index === 0"
                :aria-label="t('dashboard.layout.moveTabUp')"
                @click="moveItem(index, -1)"
              />
              <UButton
                icon="i-lucide-chevron-down"
                color="neutral"
                variant="ghost"
                size="xs"
                :disabled="index === order.length - 1"
                :aria-label="t('dashboard.layout.moveTabDown')"
                @click="moveItem(index, 1)"
              />
            </div>
          </div>
        </div>

        <div v-if="poolItems.length" class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">
            {{ t('dashboard.layout.addFooterTab') }}
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="item in poolItems"
              :key="item.to"
              type="button"
              class="flex min-h-12 items-center gap-2 rounded-xl border border-default bg-elevated/20 px-3 py-2 text-left transition-colors hover:bg-elevated/50"
              @click="addToSelected(item.to)"
            >
              <UIcon :name="item.icon" class="size-4 shrink-0 text-muted" />
              <span class="min-w-0 text-sm leading-snug line-clamp-2">{{ item.label }}</span>
            </button>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 pt-1">
          <UButton
            :label="t('dashboard.layout.resetFooter')"
            color="neutral"
            variant="outline"
            size="sm"
            @click="onReset"
          />
          <UButton
            :label="t('common.save')"
            size="sm"
            @click="closeCustomizer"
          />
        </div>
      </div>
    </template>
  </USlideover>
</template>
