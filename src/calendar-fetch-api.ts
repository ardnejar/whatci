import type { CalendarEvent } from './EventStore'
import { EventStore } from './EventStore'

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

    // Filter to show only first occurrence of recurring events
    const seenRecurringEvents = new Set<string>()
    const events: CalendarEvent[] = data.items
      .filter((item: any) => {
        // If this is a recurring event instance
        if (item.recurringEventId) {
          // Skip if we've already seen this recurring event
          if (seenRecurringEvents.has(item.recurringEventId)) {
            return false
          }
          // Mark this recurring event as seen
          seenRecurringEvents.add(item.recurringEventId)
        }
        return true
      })
      .map((item: any) => ({
        summary: item.summary || 'No Title',
        description: item.description || null,
        startDate: item.start.dateTime || item.start.date,
        endDate: item.end.dateTime || item.end.date,
        location: item.location || null,
        uid: item.id,
        attendees: item.attendees ? item.attendees.map((a: any) => a.email) : [],
        isRecurring: !!item.recurringEventId,
        url: null, // Google Calendar API v3 doesn't expose the iCal URL field
      }))

    // Save to localStorage
    this.saveEvents(events)

    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('calendar-updated'))

    this.saveLastFetch()
  }
}
