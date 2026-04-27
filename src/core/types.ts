/**
  Shared types for calendar events across all platforms
**/

export interface CalendarEvent {
  summary: string
  description: string | null
  startDate: string
  endDate: string
  isRecurring: boolean
  location: string | null
  uid: string
  attendees?: string[]
  url: string | null
}

export type LocationFilter = 'Bellingham' | 'Elsewhere' | undefined
