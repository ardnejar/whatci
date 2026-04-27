import type { CalendarEvent } from '../../src/core/types.ts'

export interface Env {
  CALENDAR_ID: string
  GOOGLE_API_KEY: string
  CALENDAR_KV: KVNamespace
  ADMIN_TOKEN: string
}

interface KvMetadata {
  updatedAt: number
}

const KV_KEY = 'events'
const STALE_AFTER_MS = 60 * 60 * 1000

/**
  Fetch upcoming events from Google Calendar API and return as CalendarEvent[].
  Fetches from today forward with no upper date limit.
**/
export async function fetchGoogleCalendarEvents(env: Env): Promise<CalendarEvent[]> {
  const now = new Date()
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.CALENDAR_ID)}/events` +
    `?key=${env.GOOGLE_API_KEY}` +
    `&maxResults=2500` +
    `&singleEvents=true` +
    `&timeMin=${encodeURIComponent(now.toISOString())}` +
    `&orderBy=startTime`

  const upstream = await fetch(url)
  if (!upstream.ok) {
    throw new Error(`Google Calendar API error: ${upstream.status} ${upstream.statusText}`)
  }

  const data = (await upstream.json()) as { items: GoogleCalendarItem[] }

  return data.items.map((item) => ({
    summary: item.summary || 'No Title',
    description: item.description || null,
    startDate: item.start.dateTime || item.start.date,
    endDate: item.end.dateTime || item.end.date,
    location: item.location || null,
    uid: item.id,
    recurringEventId: item.recurringEventId ?? null,
    attendees: item.attendees ? item.attendees.map((a) => a.email) : [],
    isRecurring: !!item.recurringEventId,
    url: null,
  }))
}

/**
  Fetch events from Google Calendar and write them to KV with an updatedAt timestamp.
**/
export async function refreshKv(env: Env): Promise<void> {
  const events = await fetchGoogleCalendarEvents(env)
  await env.CALENDAR_KV.put(KV_KEY, JSON.stringify(events), {
    metadata: { updatedAt: Date.now() } satisfies KvMetadata,
  })
}

/**
  Read events from KV and return them along with a staleness flag.
  Returns null events if KV is empty (cold start).
**/
export async function getKvEvents(env: Env): Promise<{ events: CalendarEvent[] | null; is_stale: boolean }> {
  const { value, metadata } = await env.CALENDAR_KV.getWithMetadata<KvMetadata>(KV_KEY, 'json')
  const events = value as CalendarEvent[] | null
  const is_stale = !metadata || Date.now() - (metadata as KvMetadata).updatedAt > STALE_AFTER_MS
  return { events, is_stale }
}

interface GoogleCalendarItem {
  id: string
  summary?: string
  description?: string
  location?: string
  recurringEventId?: string
  start: { dateTime?: string; date: string }
  end: { dateTime?: string; date: string }
  attendees?: { email: string }[]
}
