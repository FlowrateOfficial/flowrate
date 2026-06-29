<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { DateFormatter, Time, getLocalTimeZone, today, type CalendarDate } from '@internationalized/date'
import { formatCalendarDate, formatTimeValue, parseCalendarDate, parseTimeValue, type DateRangePreset } from '~/utils/date-pickers'

const dateFrom = defineModel<string>('dateFrom', { default: '' })
const dateTo = defineModel<string>('dateTo', { default: '' })
const timeFrom = defineModel<string>('timeFrom', { default: '' })
const timeTo = defineModel<string>('timeTo', { default: '' })

const props = withDefaults(defineProps<{
  placeholder?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showTime?: boolean
}>(), {
  size: 'lg',
  showTime: true
})

const { t, intlLocale } = useAppI18n()
const open = ref(false)
const tz = getLocalTimeZone()
const df = computed(() => new DateFormatter(intlLocale.value, { dateStyle: 'medium' }))
const breakpoints = useBreakpoints(breakpointsTailwind)
const isDesktop = breakpoints.greaterOrEqual('sm')

type RangeModel = { start: CalendarDate, end: CalendarDate }

const rangeValue = shallowRef<RangeModel | undefined>()
const startTime = shallowRef<Time | undefined>()
const endTime = shallowRef<Time | undefined>()

const presetRanges = computed(() => [
  { key: '7d', label: t('dashboard.dateRange.last7Days'), days: 7 },
  { key: '14d', label: t('dashboard.dateRange.last14Days'), days: 14 },
  { key: '30d', label: t('dashboard.dateRange.last30Days'), days: 30 },
  { key: '3m', label: t('dashboard.dateRange.last3Months'), months: 3 },
  { key: '6m', label: t('dashboard.dateRange.last6Months'), months: 6 },
  { key: '1y', label: t('dashboard.dateRange.lastYear'), years: 1 }
])

const triggerProps = computed(() => ({
  color: 'neutral' as const,
  variant: 'outline' as const,
  block: true,
  size: props.size,
  class: 'min-h-11 justify-between font-normal',
  icon: 'i-lucide-calendar-range',
  label: displayLabel.value,
  trailingIcon: 'i-lucide-chevron-down'
}))

function syncFromModels() {
  const start = parseCalendarDate(dateFrom.value)
  const end = parseCalendarDate(dateTo.value)
  rangeValue.value = start && end ? { start, end } : undefined
  startTime.value = parseTimeValue(timeFrom.value)
  endTime.value = parseTimeValue(timeTo.value)
}

watch([dateFrom, dateTo, timeFrom, timeTo], syncFromModels, { immediate: true })

watch(rangeValue, (value) => {
  dateFrom.value = value?.start ? formatCalendarDate(value.start) : ''
  dateTo.value = value?.end ? formatCalendarDate(value.end) : ''
})

watch(startTime, (value) => {
  timeFrom.value = value ? formatTimeValue(value) : ''
})

watch(endTime, (value) => {
  timeTo.value = value ? formatTimeValue(value) : ''
})

const displayLabel = computed(() => {
  if (!rangeValue.value?.start && !dateFrom.value) return props.placeholder ?? t('dashboard.dateRange.pickRange')
  const start = rangeValue.value?.start ?? parseCalendarDate(dateFrom.value)
  const end = rangeValue.value?.end ?? parseCalendarDate(dateTo.value)
  if (start && !end) return df.value.format(start.toDate(tz))
  if (start && end) return `${df.value.format(start.toDate(tz))} – ${df.value.format(end.toDate(tz))}`
  return props.placeholder ?? t('dashboard.dateRange.pickRange')
})

function computePresetRange(range: DateRangePreset): RangeModel {
  const end = today(tz)
  return {
    start: end.subtract({ days: range.days, months: range.months, years: range.years }),
    end
  }
}

function isPresetSelected(range: DateRangePreset) {
  const current = rangeValue.value
  if (!current?.start || !current?.end) return false
  const preset = computePresetRange(range)
  return current.start.compare(preset.start) === 0 && current.end.compare(preset.end) === 0
}

function selectPreset(range: DateRangePreset) {
  rangeValue.value = computePresetRange(range)
}

function clearRange() {
  rangeValue.value = undefined
  dateFrom.value = ''
  dateTo.value = ''
  timeFrom.value = ''
  timeTo.value = ''
  startTime.value = undefined
  endTime.value = undefined
  open.value = false
}

function applyRange() {
  open.value = false
}
</script>

<template>
  <ClientOnly>
    <UPopover
      v-if="isDesktop"
    v-model:open="open"
    :content="{ align: 'start', side: 'bottom', collisionPadding: 16 }"
    :ui="{ content: 'w-auto max-w-[calc(100vw-2rem)] p-0' }"
  >
    <UButton v-bind="triggerProps" />

    <template #content>
      <DashboardDateRangePickerPanel
        v-model:range-value="rangeValue"
        v-model:start-time="startTime"
        v-model:end-time="endTime"
        :preset-ranges="presetRanges"
        :is-desktop="isDesktop"
        :show-time="showTime"
        :is-preset-selected="isPresetSelected"
        @select-preset="selectPreset"
      />
      <div class="flex justify-end gap-2 border-t border-default p-2">
        <UButton
          :label="t('common.clear')"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="clearRange"
        />
        <UButton
          :label="t('common.save')"
          size="sm"
          @click="applyRange"
        />
      </div>
    </template>
  </UPopover>

  <div v-else class="w-full">
    <UButton v-bind="triggerProps" @click="open = true" />

    <UDrawer
      v-model:open="open"
      direction="bottom"
      :title="t('dashboard.dateRange.pickRange')"
      :ui="{ content: 'max-h-[92dvh]', body: 'overflow-y-auto p-0' }"
    >
      <template #body>
        <DashboardDateRangePickerPanel
          v-model:range-value="rangeValue"
          v-model:start-time="startTime"
          v-model:end-time="endTime"
          :preset-ranges="presetRanges"
          :is-desktop="isDesktop"
          :show-time="showTime"
          :is-preset-selected="isPresetSelected"
          @select-preset="selectPreset"
        />
      </template>
      <template #footer>
        <div class="flex w-full gap-2 p-4">
          <UButton
            :label="t('common.clear')"
            color="neutral"
            variant="outline"
            class="flex-1"
            @click="clearRange"
          />
          <UButton
            :label="t('common.save')"
            class="flex-1"
            @click="applyRange"
          />
        </div>
      </template>
    </UDrawer>
  </div>

    <template #fallback>
      <UButton v-bind="triggerProps" />
    </template>
  </ClientOnly>
</template>
