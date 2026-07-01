<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import type { CalendarDate } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
import { formatCalendarDate, parseCalendarDate } from '~/utils/date-pickers'

const model = defineModel<string>({ default: '' })

const props = withDefaults(defineProps<{
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  size: 'lg'
})

const { t, intlLocale } = useAppI18n()
const open = ref(false)
const tz = getLocalTimeZone()
const breakpoints = useBreakpoints(breakpointsTailwind)
const isDesktop = breakpoints.greaterOrEqual('sm')

const df = computed(() => new DateFormatter(intlLocale.value, { dateStyle: 'medium' }))
const calendarValue = shallowRef<CalendarDate | undefined>()

watch(model, (value) => {
  calendarValue.value = parseCalendarDate(value)
}, { immediate: true })

watch(calendarValue, (value) => {
  model.value = value ? formatCalendarDate(value) : ''
})

const displayLabel = computed(() => {
  if (!calendarValue.value) return props.placeholder ?? t('dashboard.dateField.pickDate')
  return df.value.format(calendarValue.value.toDate(tz))
})

const triggerProps = computed(() => ({
  color: 'neutral' as const,
  variant: 'outline' as const,
  block: true,
  size: props.size,
  class: 'min-h-11 justify-between font-normal',
  disabled: props.disabled,
  trailingIcon: 'i-lucide-calendar-days',
  label: displayLabel.value
}))

function clearDate() {
  calendarValue.value = undefined
  model.value = ''
  open.value = false
}

function applyDate() {
  open.value = false
}
</script>

<template>
  <ClientOnly>
    <UPopover
      v-if="isDesktop"
      v-model:open="open"
      :content="{ side: 'bottom', collisionPadding: 16 }"
      :ui="{ content: 'w-auto max-w-[calc(100vw-2rem)] p-0' }"
    >
      <UButton v-bind="triggerProps" />

      <template #content>
        <div class="p-2">
          <UCalendar
            v-model="calendarValue"
            color="neutral"
            class="mx-auto"
          />
          <div class="flex justify-end gap-2 border-t border-default p-2">
            <UButton
              :label="t('common.clear')"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="clearDate"
            />
            <UButton
              :label="t('common.save')"
              size="sm"
              @click="applyDate"
            />
          </div>
        </div>
      </template>
    </UPopover>

    <div
      v-else
      class="w-full"
    >
      <UButton
        v-bind="triggerProps"
        @click="open = true"
      />

      <UDrawer
        v-model:open="open"
        direction="bottom"
        :title="props.placeholder ?? t('dashboard.dateField.pickDate')"
        :ui="{ content: 'max-h-[85dvh]', body: 'overflow-y-auto p-2' }"
      >
        <template #body>
          <UCalendar
            v-model="calendarValue"
            color="neutral"
            size="sm"
            class="mx-auto w-full max-w-sm"
          />
        </template>
        <template #footer>
          <div class="flex w-full gap-2 p-4">
            <UButton
              :label="t('common.clear')"
              color="neutral"
              variant="outline"
              class="flex-1"
              @click="clearDate"
            />
            <UButton
              :label="t('common.save')"
              class="flex-1"
              @click="applyDate"
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
