interface Env {
  CALENDAR_ID: string
  GOOGLE_API_KEY: string
}

/**
  Fetches upcoming calendar events from Google Calendar API.

  @param {Request} request - The incoming request. Supports an optional `endDate` query parameter
    (ISO 8601 string) to limit results. If omitted, returns all events from now up to the API maximum.
  @param {Env} env - Cloudflare environment bindings.

  @example
  // All events from now onwards
  GET /calendar-events

  @example
  // Events from now through end of year
  GET /calendar-events?endDate=2026-12-31T23:59:59Z
**/
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const { CALENDAR_ID, GOOGLE_API_KEY } = env

  const { searchParams } = new URL(request.url)
  const now = new Date()
  const end_date_param = searchParams.get('endDate')
  const end_date = end_date_param ? new Date(end_date_param) : null

  if (end_date !== null && isNaN(end_date.getTime())) {
    return new Response(JSON.stringify({ error: { message: `Invalid endDate: ${end_date_param}` } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events` +
    `?key=${GOOGLE_API_KEY}` +
    `&maxResults=2500` +
    `&singleEvents=true` +
    `&timeMin=${encodeURIComponent(now.toISOString())}` +
    (end_date ? `&timeMax=${encodeURIComponent(end_date.toISOString())}` : '') +
    `&orderBy=startTime`

  const upstream = await fetch(url)
  const body = await upstream.text()

  return new Response(body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
