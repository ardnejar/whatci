import type { CalendarEvent, EventFilter } from './core/types.ts'
import { mergeEvents } from './core/event-utils.ts'

export class CalendarStore {
  private _events: CalendarEvent[] = []
  private _fetched = false

  async fetch(): Promise<void> {
    const response = await fetch('/calendar-events')
    if (!response.ok) {
      const error_data = (await response.json().catch(() => ({}))) as { error?: { message?: string } }
      const error_msg = error_data.error?.message || response.statusText
      throw new Error(`Failed to fetch calendar (${response.status}): ${error_msg}`)
    }

    this._events = (await response.json()) as CalendarEvent[]
    this._fetched = true
    window.dispatchEvent(new CustomEvent('calendar-updated'))
  }

  get eventCount(): number | null {
    return this._fetched ? this._events.length : null
  }

  get(filter: EventFilter, start_date: Date, end_date: Date): CalendarEvent[] {
    if (filter === 'all') return this.getAll(start_date, end_date)
    if (filter === 'first-occurrences') return this.getFirstOccurrences(start_date, end_date)
    if (filter === 'merged') return this.getMerged(start_date, end_date)
    throw new Error(`Invalid filter: ${filter}`)
  }

  getAll(start_date: Date, end_date: Date): CalendarEvent[] {
    return this._events.filter((e) => {
      const start = new Date(e.startDate)
      return start >= start_date && start <= end_date
    })
  }

  getFirstOccurrences(start_date: Date, end_date: Date): CalendarEvent[] {
    const in_range = this.getAll(start_date, end_date).sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
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

  getMerged(start_date: Date, end_date: Date): CalendarEvent[] {
    return mergeEvents(this.getAll(start_date, end_date))
  }
}
