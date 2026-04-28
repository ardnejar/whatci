import type { CalendarEvent } from '../../src/core/types.ts'
import { mergeEvents } from '../../src/core/event-utils.ts'

/**
  Filter events to those starting within the next 6 months, merge consecutive
  same-named events, and return the result.
**/
export function upcomingMerged(events: CalendarEvent[]): CalendarEvent[] {
  const now = new Date()
  const six_months = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate())
  return mergeEvents(
    events.filter((e) => {
      const start = new Date(e.startDate)
      return start >= now && start <= six_months
    })
  )
}

/**
  Build a schema.org ItemList of Events as a JSON-LD string safe for embedding in HTML.
  Forward slashes in strings are escaped to prevent `</script>` injection.
**/
export function buildJsonLd(events: CalendarEvent[]): string {
  const json_ld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: events.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Event',
        name: event.summary,
        startDate: event.startDate,
        endDate: event.endDate,
        ...(event.location
          ? event.location.startsWith('http')
            ? {
                eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
                location: { '@type': 'VirtualLocation', url: event.location },
              }
            : { location: { '@type': 'Place', address: event.location } }
          : {}),
        ...(event.description ? { description: event.description } : {}),
      },
    })),
  }
  return JSON.stringify(json_ld).replace(/<\//g, '<\\/')
}
