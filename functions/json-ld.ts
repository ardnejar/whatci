import type { CalendarEvent } from '../src/core/types.ts'
import { buildJsonLd, upcomingMerged } from './lib/json-ld.ts'
import type { Env as CalendarEnv } from './lib/google-calendar.ts'

interface Env extends CalendarEnv {
  ASSETS: Fetcher
}

/**
  Returns the JSON-LD structured data that would be injected into index.html.
  Useful for inspecting the output without parsing it from the page.

  @example
  GET /json-ld
**/
export const onRequestGet = async ({ env }: { env: Env }): Promise<Response> => {
  const events = (await env.CALENDAR_KV.get('events', { type: 'json' })) as CalendarEvent[] | null
  if (!events || events.length === 0) {
    return new Response(JSON.stringify(null), { headers: { 'Content-Type': 'application/json' } })
  }

  const upcoming = upcomingMerged(events)
  const json_ld = JSON.parse(buildJsonLd(upcoming))

  return new Response(JSON.stringify(json_ld, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
}
