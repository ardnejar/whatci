import type { Env } from '../lib/google-calendar.ts'
import { refreshKv } from '../lib/google-calendar.ts'

/**
  Force-refreshes the KV calendar cache by fetching directly from Google Calendar.
  Requires a valid admin token via the `token` query parameter.
  Redirects to the homepage on success.

  @example
  GET /admin/refresh?token=YOUR_ADMIN_TOKEN
**/
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const { searchParams } = new URL(request.url)

  if (searchParams.get('token') !== env.ADMIN_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }

  await refreshKv(env)
  return Response.redirect('https://whatci.org/', 302)
}
