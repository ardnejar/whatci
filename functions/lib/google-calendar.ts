import type { CalendarEvent } from '../../src/core/types.ts'

export interface Env {
  CALENDAR_ID: string
  GOOGLE_API_KEY: string
  CALENDAR_KV: KVNamespace
  ADMIN_KEY: string
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
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.CALENDAR_ID)}/events`)
  url.searchParams.set('key', env.GOOGLE_API_KEY)
  url.searchParams.set('maxResults', '2500')
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('timeMin', now.toISOString())
  url.searchParams.set('orderBy', 'startTime')

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

export async function processDescription(raw: string, title_cache?: Map<string, string>): Promise<ProcessedDescription> {
  const { plain, urls } = await parseRaw(raw)
  return buildFromCache(plain, urls, title_cache)
}

const URL_RE = /https?:\/\/\S+/g
const TRAILING_PUNCT_RE = /[.,;:!?)]+$/

async function parseRaw(raw: string): Promise<{ plain: string; urls: string[] }> {
  if (!/<[a-z/!]/i.test(raw)) {
    const plain = raw.trim()
    const urls = [...new Set([...plain.matchAll(URL_RE)].map((m) => m[0].replace(TRAILING_PUNCT_RE, '')))]
    return { plain, urls }
  }

  const href_urls: string[] = []
  const chunks: string[] = []
  const rewritten = new HTMLRewriter()
    .on('br', {
      element() {
        chunks.push('\n')
      },
    })
    .on('a[href]', {
      element(el) {
        const href = el.getAttribute('href')
        if (href && /^https?:\/\//.test(href)) href_urls.push(href)
      },
    })
    .on('*', {
      text(chunk) {
        chunks.push(chunk.text)
      },
    })
    .transform(new Response(raw))
  await rewritten.text()

  const plain = chunks
    .join('')
    .replace(/[ \t]+/g, ' ')
    .replace(/ \n/g, '\n')
    .replace(/\n /g, '\n')
    .trim()
  const text_urls = [...plain.matchAll(URL_RE)].map((m) => m[0].replace(TRAILING_PUNCT_RE, ''))
  const urls = [...new Set([...href_urls, ...text_urls])]
  return { plain, urls }
}

async function buildFromCache(plain: string, urls: string[], title_cache?: Map<string, string>): Promise<ProcessedDescription> {
  if (urls.length === 0) return { text: plain, links: [] }
  const links = await Promise.all(
    urls.map(async (url) => ({
      url,
      title: title_cache?.get(url) ?? (await fetchPageTitle(url)) ?? 'Website',
    }))
  )
  return { text: plain, links }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;/gi, '')
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
    if (!match) return null
    return decodeHtmlEntities(match[1].replace(/<[^>]+>/g, '')).trim() || null
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

  // Parse all descriptions first to collect every URL across all events
  const parsed = await Promise.all(events.map((event) => (event.descriptionRaw ? parseRaw(event.descriptionRaw) : null)))

  // Fetch each unique URL exactly once
  const all_urls = [...new Set(parsed.flatMap((p) => p?.urls ?? []))]
  const title_cache = new Map<string, string>()
  await Promise.all(
    all_urls.map(async (url) => {
      title_cache.set(url, (await fetchPageTitle(url)) ?? 'Website')
    })
  )

  // Assemble results from the shared cache — no further network requests
  await Promise.allSettled(
    events.map(async (event, i) => {
      const p = parsed[i]
      if (p) {
        const { text, links } = await buildFromCache(p.plain, p.urls, title_cache)
        event.description = text
        event.descriptionLinks = links.length > 0 ? links : null
      }
    })
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
