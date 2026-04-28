import type { CalendarEvent } from '../src/core/types.ts'
import { buildJsonLd, upcomingMerged } from './lib/json-ld.ts'
import type { Env as CalendarEnv } from './lib/google-calendar.ts'

interface Env extends CalendarEnv {
  ASSETS: Fetcher
}

/**
  Serves index.html with an injected JSON-LD script block containing upcoming events
  from the KV cache. If KV is empty (cold start) the page is served without JSON-LD.
**/
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const response = await env.ASSETS.fetch(request)

  const events = (await env.CALENDAR_KV.get('events', { type: 'json' })) as CalendarEvent[] | null
  if (!events || events.length === 0) return response

  const upcoming = upcomingMerged(events)
  if (upcoming.length === 0) return response

  const json_ld = buildJsonLd(upcoming)

  return new HTMLRewriter()
    .on('head', {
      element(el) {
        el.append(`<script type="application/ld+json">${json_ld}</script>`, { html: true })
      },
    })
    .transform(response)
}
