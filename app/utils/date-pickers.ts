import { CalendarDate, Time } from '@internationalized/date'

export type DateRangePreset = {
  key: string
  label: string
  days?: number
  months?: number
  years?: number
}

export function parseCalendarDate(value: string): CalendarDate | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new CalendarDate(y, m, d)
}

export function formatCalendarDate(date: CalendarDate): string {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
}

export function parseTimeValue(value: string): Time | undefined {
  if (!value) return undefined
  const [h, m, s] = value.split(':').map(Number)
  return new Time(h ?? 0, m ?? 0, s ?? 0)
}

export function formatTimeValue(time: Time): string {
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`
}

export function toIsoDateTime(dateStr: string, timeStr: string | undefined, boundary: 'start' | 'end'): string {
  let h = 0
  let m = 0
  let s = 0

  if (timeStr) {
    const parts = timeStr.split(':').map(Number)
    h = parts[0] ?? 0
    m = parts[1] ?? 0
    s = parts[2] ?? 0
  } else if (boundary === 'end') {
    h = 23
    m = 59
    s = 59
  }

  const isoLocal = `${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return new Date(isoLocal).toISOString()
}
