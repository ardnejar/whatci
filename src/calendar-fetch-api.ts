import type { CalendarEvent } from './EventStore'
import { EventStore } from './EventStore'
import { mergeEvents } from './core/event-utils'

export class CalendarFetchApi extends EventStore {
  override store = 'calendar-events'

  async fetch(): Promise<void> {
    const response = await fetch('/calendar-events')
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.error?.message || response.statusText
      throw new Error(`Failed to fetch calendar (${response.status}): ${errorMsg}`)
    }

    const data = await response.json()

    const events: CalendarEvent[] = data.items.map((item: any) => ({
      summary: item.summary || 'No Title',
      description: item.description || null,
      startDate: item.start.dateTime || item.start.date,
      endDate: item.end.dateTime || item.end.date,
      location: item.location || null,
      uid: item.id,
      recurringEventId: item.recurringEventId ?? null,
      attendees: item.attendees ? item.attendees.map((a: any) => a.email) : [],
      isRecurring: !!item.recurringEventId,
      url: null,
    }))

    this.saveEvents(events)
    window.dispatchEvent(new CustomEvent('calendar-updated'))
    this.saveLastFetch()
  }

  getAll(start_date: Date, end_date: Date): CalendarEvent[] {
    return this.loadEvents().filter((e) => {
      const start = new Date(e.startDate)
      return start >= start_date && start <= end_date
    })
  }

  getFirstOccurrences(start_date: Date, end_date: Date): CalendarEvent[] {
    const in_range = this.getAll(start_date, end_date).sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )
    const seen_recurring = new Set<string>()
    const first_occurrences = in_range.filter((e) => {
      if (!e.recurringEventId) return true
      if (seen_recurring.has(e.recurringEventId)) return false
      seen_recurring.add(e.recurringEventId)
      return true
    })
    return mergeEvents(first_occurrences)
  }
}
