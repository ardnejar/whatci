interface Env {
  CALENDAR_ID: string
  GOOGLE_API_KEY: string
}

export const onRequestGet = async ({ env }: { env: Env }): Promise<Response> => {
  const { CALENDAR_ID, GOOGLE_API_KEY } = env

  const now = new Date()
  const end_date = new Date(now)
  end_date.setMonth(now.getMonth() + 12)

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events` +
    `?key=${GOOGLE_API_KEY}` +
    `&maxResults=2500` +
    `&singleEvents=true` +
    `&timeMin=${encodeURIComponent(now.toISOString())}` +
    `&timeMax=${encodeURIComponent(end_date.toISOString())}` +
    `&orderBy=startTime`

  const upstream = await fetch(url)
  const body = await upstream.text()

  return new Response(body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
