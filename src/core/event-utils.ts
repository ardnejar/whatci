/**
  Shared event utilities - isomorphic code that works in browser and Node.js
**/

import { type CalendarEvent, type LocationFilter } from './types'

/**
  Filter and merge events by location
**/
export function filterAndMergeEvents(events: CalendarEvent[], location: LocationFilter): CalendarEvent[] {
  const now = new Date()
  const filtered = events
    .filter((e) => new Date(e.startDate) > now)
    .filter((e) => {
      if (!location) return true
      if (location === 'Bellingham') {
        // include events with null location as Bellingham
        return !e.location || e.location.includes('Bellingham')
      }
      if (location === 'Elsewhere') {
        return !!e.location && !e.location.includes('Bellingham')
      }
      return true
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  return mergeEvents(filtered)
}

/**
  Merge consecutive events with the same summary
**/
export function mergeEvents(events: CalendarEvent[]): CalendarEvent[] {
  if (events.length === 0) return []

  // Group events by normalized summary
  const groups = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const normalized_summary = event.summary.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!groups.has(normalized_summary)) {
      groups.set(normalized_summary, [])
    }
    groups.get(normalized_summary)!.push(event)
  }

  // Merge events within each group
  const merged: CalendarEvent[] = []
  for (const group_events of groups.values()) {
    if (group_events.length === 1) {
      merged.push(group_events[0])
      continue
    }

    // Sort by start date within group
    group_events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

    let current = group_events[0]
    for (let i = 1; i < group_events.length; i++) {
      const next = group_events[i]
      const current_end = new Date(current.endDate).getTime()
      const next_start = new Date(next.startDate).getTime()
      const hours_diff = (next_start - current_end) / (1000 * 60 * 60)

      if (hours_diff < 48) {
        // Merge: extend the end date if next event ends later
        if (new Date(next.endDate).getTime() > current_end) {
          current = { ...current, endDate: next.endDate }
        }
      } else {
        // Don't merge: add current and start new one
        merged.push(current)
        current = next
      }
    }
    merged.push(current)
  }

  // Sort all merged events by start date
  return merged.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
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
  Format time range as "3pm - 5pm"
**/
export function formatTimeRange(event: CalendarEvent): string {
  const start_time = formatTime(event.startDate)
  const end_time = formatTime(event.endDate)
  return `${start_time} - ${end_time}`
}

/**
  Format a multi-day range as "8-10, Fri-Sun" or "Apr 30-May 2, Thu-Sat"
**/
export function formatDayRangeShort(start_string: string, end_string: string): string {
  const start = new Date(start_string)
  const end = new Date(end_string)
  const start_day = start.getDate()
  const end_day = end.getDate()
  const start_weekday = start.toLocaleString('en-US', { weekday: 'short' })
  const end_weekday = end.toLocaleString('en-US', { weekday: 'short' })
  if (start.getMonth() !== end.getMonth()) {
    const start_month = start.toLocaleString('en-US', { month: 'short' })
    const end_month = end.toLocaleString('en-US', { month: 'short' })
    return `${start_month} ${start_day}-${end_month} ${end_day}, ${start_weekday}-${end_weekday}`
  }
  return `${start_day}-${end_day}, ${start_weekday}-${end_weekday}`
}

/**
  Format date as "28, Mon" (day number + weekday short)
**/
export function formatDayShort(date_string: string): string {
  const date = new Date(date_string)
  const weekday = date.toLocaleString('en-US', { weekday: 'short' })
  const day = date.getDate()
  return `${day}, ${weekday}`
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
  Strip newlines and return cleaned text
**/
export function stripNewlines(text: string | null | undefined): string {
  if (!text) return ''
  // Replace any sequence of CR/LF/newline with a single space and trim
  return text.replace(/\r?\n+/g, ' ').trim()
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
