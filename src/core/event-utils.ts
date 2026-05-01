/**
  Shared event utilities - isomorphic code that works in browser and Node.js
**/

import { type CalendarEvent } from './types'

/**
  Merge consecutive events with the same summary
**/
export function mergeEvents(events: CalendarEvent[]): CalendarEvent[] {
  if (events.length === 0) return []

  const sorted = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  const open = new Map<string, CalendarEvent>()
  const result: CalendarEvent[] = []

  for (const event of sorted) {
    const key = event.summary.toLowerCase().replace(/[^a-z0-9]/g, '')
    const current = open.get(key)

    if (!current) {
      open.set(key, event)
      continue
    }

    const hours_diff = (new Date(event.startDate).getTime() - new Date(current.endDate).getTime()) / (1000 * 60 * 60)

    if (hours_diff < 48) {
      // Merge: extend end date if this event ends later
      if (new Date(event.endDate).getTime() > new Date(current.endDate).getTime()) {
        open.set(key, { ...current, endDate: event.endDate })
      }
    } else {
      // Gap too large: emit the current span, start a new one
      result.push(current)
      open.set(key, event)
    }
  }

  for (const event of open.values()) {
    result.push(event)
  }

  return result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
}

/**
  Format date as "Mon DD"
**/
export function formatDateShort(date_string: string): string {
  const date = new Date(date_string)
  const month = date.toLocaleString('en-US', { month: 'short' })
  const day = date.getDate()
  return `${month} ${day}`
}

/**
  Format event date range (handles single day and multi-day)
**/
export function formatEventDate(event: CalendarEvent): string {
  const start = new Date(event.startDate)
  const end = new Date(event.endDate)
  const is_same_day =
    start.getDate() === end.getDate() && start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()

  if (is_same_day) return formatDateShort(event.startDate)

  const start_month = start.toLocaleString('en-US', { month: 'short' })
  const start_day = start.getDate()
  const end_day = end.getDate()
  if (start.getMonth() === end.getMonth()) return `${start_month} ${start_day}-${end_day}`
  const end_month = end.toLocaleString('en-US', { month: 'short' })
  return `${start_month} ${start_day} - ${end_month} ${end_day}`
}

/**
  Format time as "3pm" or "3:30pm"
**/
export function formatTime(date_string: string): string {
  const d = new Date(date_string)
  let hours = d.getHours()
  const minutes = d.getMinutes()
  const ampm = hours >= 12 ? 'pm' : 'am'
  hours = hours % 12
  if (hours === 0) hours = 12
  if (minutes === 0) {
    return `${hours}${ampm}`
  }
  const mins = minutes.toString().padStart(2, '0')
  return `${hours}:${mins}${ampm}`
}

/**
  Format a multi-day date range as "8-10" or "Apr 30-May 2"
**/
export function formatDateRange(start_string: string, end_string: string): string {
  const start = new Date(start_string)
  const end = new Date(end_string)
  const start_day = start.getDate()
  const end_day = end.getDate()
  if (start.getMonth() !== end.getMonth()) {
    const start_month = start.toLocaleString('en-US', { month: 'short' })
    const end_month = end.toLocaleString('en-US', { month: 'short' })
    return `${start_month} ${start_day}-${end_month} ${end_day}`
  }
  return `${start_day}-${end_day}`
}

/**
  Format a weekday range as "Fri-Sun"
**/
export function formatWeekdayRange(start_string: string, end_string: string): string {
  const start = new Date(start_string)
  const end = new Date(end_string)
  const start_weekday = start.toLocaleString('en-US', { weekday: 'short' })
  const end_weekday = end.toLocaleString('en-US', { weekday: 'short' })
  return `${start_weekday}-${end_weekday}`
}

/**
  Format date as "28, Mon" (day number + weekday short)
**/
export function formatDayShort(date_string: string): string {
  const date = new Date(date_string)
  const weekday = date.toLocaleString('en-US', { weekday: 'short' })
  const day = date.getDate()
  return `${day} ${weekday}`
}

/**
  Get recurring label if event is recurring
 */
export function maybeRecurringLabel(event: CalendarEvent): string {
  return event.isRecurring
    ? ` (${new Date(event.startDate).toLocaleString('en-US', {
        weekday: 'long',
      })}s...)`
    : ''
}

/**
  Returns a pair of formatted time strings for a start/end range.
  If start and end share the same am/pm period, the suffix is omitted from
  the start time so the pair renders as e.g. "1–4pm" instead of "1pm–4pm".
**/
export function formatTimePair(start_date: string, end_date: string): [string, string] {
  const start = new Date(start_date)
  const end = new Date(end_date)
  const start_ampm = start.getHours() >= 12 ? 'pm' : 'am'
  const end_ampm = end.getHours() >= 12 ? 'pm' : 'am'
  const same_period = start_ampm === end_ampm

  const fmt = (d: Date): string => {
    let h = d.getHours() % 12
    if (h === 0) h = 12
    const m = d.getMinutes()
    return m === 0 ? `${h}` : `${h}:${m.toString().padStart(2, '0')}`
  }

  return [same_period ? fmt(start) : `${fmt(start)}${start_ampm}`, `${fmt(end)}${end_ampm}`]
}
