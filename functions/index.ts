import type { CalendarEvent } from '../src/core/types.ts'
import type { Env as CalendarEnv } from './lib/google-calendar.ts'

interface Env extends CalendarEnv {
  ASSETS: Fetcher
}

/**
  Build a schema.org ItemList of Events as a JSON-LD string safe for embedding in HTML.
  Forward slashes in strings are escaped to prevent `</script>` injection.
**/
function buildJsonLd(events: CalendarEvent[]): string {
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
        ...(event.location ? { location: { '@type': 'Place', address: event.location } } : {}),
        ...(event.description ? { description: event.description } : {}),
      },
    })),
  }
  return JSON.stringify(json_ld).replace(/<\//g, '<\\/')
}

/**
  Serves index.html with an injected JSON-LD script block containing upcoming events
  from the KV cache. If KV is empty (cold start) the page is served without JSON-LD.
**/
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const response = await env.ASSETS.fetch(request)

  const events = (await env.CALENDAR_KV.get('events', { type: 'json' })) as CalendarEvent[] | null
  if (!events || events.length === 0) return response

  const json_ld = buildJsonLd(events)

  return new HTMLRewriter()
    .on('head', {
      element(el) {
        el.append(`<script type="application/ld+json">${json_ld}</script>`, { html: true })
      },
    })
    .transform(response)
}
