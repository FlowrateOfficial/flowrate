<script setup lang="ts">
// ANCHOR: Renewal calendar — charge days highlighted, browse any month up to 12 mo
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import type { RenewalCalendarResponse } from '#shared/api/subscriptions'
import type { RenewalCalendarEvent } from '#shared/subscription-calendar'
import { groupEventsByDate } from '#shared/subscription-calendar'
import { formatCalendarDate, parseCalendarDate } from '~/utils/date-pickers'

const props = defineProps<{
  data: RenewalCalendarResponse | null
  loading?: boolean
}>()

const { t, formatCurrency, formatShortDate } = useAppI18n()
const tz = getLocalTimeZone()

const selected = shallowRef<CalendarDate | undefined>()
const placeholder = shallowRef<CalendarDate | undefined>()

const eventsByDate = computed(() => {
  if (!props.data?.events.length) return new Map<string, RenewalCalendarEvent[]>()
  return groupEventsByDate(props.data.events)
})

const chargeDates = computed(() => new Set(eventsByDate.value.keys()))

const selectedKey = computed(() =>
  selected.value ? formatCalendarDate(selected.value) : ''
)

const selectedEvents = computed(() =>
  selectedKey.value ? (eventsByDate.value.get(selectedKey.value) ?? []) : []
)

const selectedDayTotal = computed(() =>
  selectedEvents.value.reduce((sum: number, event: RenewalCalendarEvent) => sum + event.amount, 0)
)

const visibleMonthChargeCount = computed(() => {
  if (!placeholder.value) return 0
  const y = placeholder.value.year
  const m = placeholder.value.month
  let count = 0
  for (const date of chargeDates.value) {
    const [yy, mm] = date.split('-').map(Number)
    if (yy === y && mm === m) count++
  }
  return count
})

function isChargeDay(date: DateValue) {
  return chargeDates.value.has(formatCalendarDate(date as CalendarDate))
}

function pickInitialDay(events: RenewalCalendarResponse['events']) {
  const todayKey = formatCalendarDate(today(tz))
  if (chargeDates.value.has(todayKey)) {
    return parseCalendarDate(todayKey)
  }
  const next = events.find(event => event.date >= todayKey)
  return parseCalendarDate(next?.date ?? events[0]!.date)
}

watch(
  () => props.data?.events,
  (events) => {
    if (!events?.length) {
      selected.value = undefined
      placeholder.value = today(tz)
      return
    }
    const day = pickInitialDay(events)
    selected.value = day
    placeholder.value = day
  },
  { immediate: true }
)

watch(placeholder, (month) => {
  if (!month || !props.data?.events.length) return
  const key = formatCalendarDate(month)
  if (chargeDates.value.has(key)) return

  const y = month.year
  const m = month.month
  const inMonth = [...chargeDates.value]
    .filter((date) => {
      const [yy, mm] = date.split('-').map(Number)
      return yy === y && mm === m
    })
    .sort()

  if (inMonth.length) {
    selected.value = parseCalendarDate(inMonth[0]!)
  }
})
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
    <div>
      <UCalendar
        v-model="selected"
        v-model:placeholder="placeholder"
        color="primary"
        variant="subtle"
        class="mx-auto w-full max-w-sm **:data-outside-view:opacity-40"
        :is-date-highlightable="isChargeDay"
      >
        <template #day="{ day }">
          <UChip
            :show="isChargeDay(day)"
            color="primary"
            size="2xs"
            :ui="{ base: 'w-full' }"
          >
            <span :class="isChargeDay(day) ? 'font-semibold' : 'font-medium'">{{ day.day }}</span>
          </UChip>
        </template>
      </UCalendar>

      <div class="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-muted">
        <span class="inline-flex items-center gap-1.5">
          <span class="size-2 rounded-full bg-primary" />
          {{ t('dashboard.subscriptions.calendarChargeDay') }}
        </span>
        <span v-if="visibleMonthChargeCount" class="text-muted">
          {{ t('dashboard.subscriptions.calendarMonthCount', { count: visibleMonthChargeCount }) }}
        </span>
      </div>
      <p class="mt-2 text-center text-xs text-muted">
        {{ t('dashboard.subscriptions.calendarHint') }}
      </p>
    </div>

    <div class="min-w-0">
      <div v-if="loading" class="space-y-2">
        <USkeleton v-for="i in 4" :key="i" class="h-12 w-full rounded-lg" />
      </div>

      <template v-else-if="data?.events.length && selected">
        <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 class="text-sm font-semibold">
            {{ t('dashboard.subscriptions.calendarDayTitle', { date: formatShortDate(selectedKey) }) }}
          </h3>
          <p v-if="selectedEvents.length" class="text-sm font-semibold tabular-nums text-primary">
            {{ formatCurrency(selectedDayTotal, data.currency) }}
          </p>
        </div>

        <ul v-if="selectedEvents.length" class="divide-y divide-default rounded-lg border border-default">
          <li
            v-for="event in selectedEvents"
            :key="`${event.subscriptionId}-${event.date}`"
            class="flex items-center justify-between gap-3 px-3 py-2.5"
          >
            <span class="truncate text-sm font-medium">{{ event.name }}</span>
            <span class="shrink-0 text-sm font-semibold tabular-nums">
              {{ formatCurrency(event.amount, event.currency) }}
            </span>
          </li>
        </ul>
        <p v-else class="text-sm text-muted">{{ t('dashboard.subscriptions.calendarDayEmpty') }}</p>
      </template>

      <UEmpty
        v-else
        icon="i-lucide-calendar-days"
        :title="t('dashboard.subscriptions.calendarEmpty')"
        variant="naked"
        size="sm"
      />
    </div>
  </div>
</template>
