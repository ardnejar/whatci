/**
  Shared types for calendar events across all platforms
**/

export interface DescriptionLink {
  url: string
  title: string
}

export interface CalendarEvent {
  summary: string
  descriptionRaw: string | null
  description: string | null
  descriptionLinks: DescriptionLink[] | null
  startDate: string
  endDate: string
  isRecurring: boolean
  recurringEventId: string | null
  location: string | null
  uid: string
  attendees?: string[]
  url: string | null
}

export type EventFilter = 'all' | 'first-occurrences' | 'merged'
