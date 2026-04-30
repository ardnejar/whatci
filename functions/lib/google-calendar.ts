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
  descriptionRaw holds the original Google Calendar HTML; description and descriptionLinks are populated by refreshKv.
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
    descriptionRaw: item.description || null,
    description: null,
    descriptionLinks: null,
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

export interface ProcessedDescription {
  text: string
  links: { url: string; title: string }[]
}

export async function processDescription(raw: string): Promise<ProcessedDescription> {
  const url_re = /https?:\/\/\S+/g

  // Short-circuit for plain text — HTMLRewriter is not needed and not available in tests
  if (!/<[a-z/!]/i.test(raw)) {
    const plain = raw.trim()
    const urls = [...new Set([...plain.matchAll(url_re)].map((m) => m[0].replace(/[.,;:!?)]+$/, '')))]
    return fetchLinks(plain, urls)
  }

  // HTML path — strip tags, collect newlines from <br>, extract hrefs from <a>
  const href_urls: string[] = []
  const chunks: string[] = []
  const rewritten = new HTMLRewriter()
    .on('br', { element() { chunks.push('\n') } })
    .on('a[href]', {
      element(el) {
        const href = el.getAttribute('href')
        if (href && /^https?:\/\//.test(href)) href_urls.push(href)
      },
    })
    .on('*', { text(chunk) { chunks.push(chunk.text) } })
    .transform(new Response(raw))
  await rewritten.text()

  const plain = chunks.join('').trim()
  const text_urls = [...plain.matchAll(url_re)].map((m) => m[0].replace(/[.,;:!?)]+$/, ''))
  const all_urls = [...new Set([...href_urls, ...text_urls])]
  return fetchLinks(plain, all_urls)
}

async function fetchLinks(plain: string, urls: string[]): Promise<ProcessedDescription> {
  if (urls.length === 0) return { text: plain, links: [] }
  const links = await Promise.all(
    urls.map(async (url) => ({ url, title: (await fetchPageTitle(url)) ?? 'Website' })),
  )
  return { text: plain, links }
}

async function fetchPageTitle(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'text/html' } })
    clearTimeout(timer)
    if (!response.ok) return null
    const content_type = response.headers.get('content-type') ?? ''
    if (!content_type.includes('text/html')) return null

    const reader = response.body?.getReader()
    if (!reader) return null

    let chunk = ''
    while (chunk.length < 32_768) {
      const { done, value } = await reader.read()
      if (done) break
      chunk += new TextDecoder().decode(value)
      if (/<\/title>/i.test(chunk)) break
    }
    reader.cancel()

    const match = chunk.match(/<title[^>]*>([^<]*)<\/title>/i)
    return match ? match[1].trim() : null
  } catch {
    clearTimeout(timer)
    return null
  }
}

/**
  Fetch events from Google Calendar and write them to KV with an updatedAt timestamp.
**/
export async function refreshKv(env: Env): Promise<void> {
  const events = await fetchGoogleCalendarEvents(env)

  await Promise.allSettled(
    events.map(async (event) => {
      if (event.descriptionRaw) {
        const { text, links } = await processDescription(event.descriptionRaw)
        event.description = text
        event.descriptionLinks = links.length > 0 ? links : null
      }
    }),
  )

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
