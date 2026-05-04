import type { Env } from './lib/google-calendar.ts'
import { getKvEvents, maybeRenewWatchChannel, refreshKv } from './lib/google-calendar.ts'

/**
  Returns calendar events as CalendarEvent[] JSON, served from KV cache.

  On first request (cold start / empty KV), blocks to fetch from Google Calendar.
  On subsequent requests, returns KV data immediately. If the cached data is older
  than 1 hour, a background refresh is triggered via waitUntil so the next request
  gets fresh data without any added latency.

  @example
  GET /calendar-events
**/
export const onRequestGet = async ({
  env,
  waitUntil,
}: {
  env: Env
  waitUntil: (promise: Promise<unknown>) => void
}): Promise<Response> => {
  const { events, is_stale } = await getKvEvents(env)

  if (events === null) {
    console.log('[calendar-events] Cold start — KV empty, blocking fetch from Google Calendar')
    await refreshKv(env)
    const { events: fresh } = await getKvEvents(env)
    return new Response(JSON.stringify(fresh ?? []), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (is_stale) {
    console.log('[calendar-events] KV cache is stale — triggering background refresh')
    waitUntil(refreshKv(env))
    waitUntil(maybeRenewWatchChannel(env))
  } else {
    console.log('[calendar-events] Serving from KV cache')
  }

  return new Response(JSON.stringify(events), {
    headers: { 'Content-Type': 'application/json' },
  })
}
