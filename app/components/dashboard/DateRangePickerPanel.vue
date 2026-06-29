<script setup lang="ts">
import type { CalendarDate, Time } from '@internationalized/date'
import type { DateRangePreset } from '~/utils/date-pickers'

defineProps<{
  presetRanges: DateRangePreset[]
  isDesktop: boolean
  showTime?: boolean
  isPresetSelected: (range: DateRangePreset) => boolean
}>()

const emit = defineEmits<{
  'select-preset': [range: DateRangePreset]
}>()

const rangeValue = defineModel<{ start: CalendarDate, end: CalendarDate } | undefined>('rangeValue')
const startTime = defineModel<Time | undefined>('startTime')
const endTime = defineModel<Time | undefined>('endTime')

const { t } = useAppI18n()
</script>

<template>
  <div class="flex w-full min-w-0 flex-col sm:flex-row sm:items-stretch sm:divide-x sm:divide-default">
    <div class="flex gap-2 overflow-x-auto border-b border-default p-3 sm:hidden">
      <UButton
        v-for="preset in presetRanges"
        :key="preset.key"
        :label="preset.label"
        color="neutral"
        :variant="isPresetSelected(preset) ? 'soft' : 'outline'"
        size="xs"
        class="shrink-0"
        @click="emit('select-preset', preset)"
      />
    </div>

    <div class="hidden shrink-0 flex-col justify-center py-2 sm:flex">
      <UButton
        v-for="preset in presetRanges"
        :key="preset.key"
        :label="preset.label"
        color="neutral"
        variant="ghost"
        class="rounded-none px-4"
        :class="isPresetSelected(preset) ? 'bg-elevated' : 'hover:bg-elevated/50'"
        truncate
        @click="emit('select-preset', preset)"
      />
    </div>

    <div class="flex min-w-0 flex-1 flex-col">
      <UCalendar
        v-model="rangeValue"
        range
        color="neutral"
        :size="isDesktop ? 'md' : 'sm'"
        class="mx-auto w-full max-w-full p-2 sm:p-3"
        :number-of-months="isDesktop ? 2 : 1"
      />

      <div
        v-if="showTime"
        class="grid grid-cols-1 gap-3 border-t border-default p-3 sm:grid-cols-2"
      >
        <UFormField :label="t('dashboard.dateRange.timeFrom')">
          <UInputTime
            v-model="startTime"
            color="neutral"
            icon="i-lucide-clock"
            :size="isDesktop ? 'md' : 'sm'"
            class="w-full"
          />
        </UFormField>
        <UFormField :label="t('dashboard.dateRange.timeTo')">
          <UInputTime
            v-model="endTime"
            color="neutral"
            icon="i-lucide-clock"
            :size="isDesktop ? 'md' : 'sm'"
            class="w-full"
          />
        </UFormField>
      </div>
    </div>
  </div>
</template>
