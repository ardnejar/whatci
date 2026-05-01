import type { Env } from '../lib/google-calendar.ts'
import { refreshKv } from '../lib/google-calendar.ts'

const COOKIE_NAME = 'admin_key'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180 // 180 days

/**
  Reads a cookie value by name from a Cookie header string.
**/
const getCookie = (cookieHeader: string, name: string): string | null => {
  for (const part of cookieHeader.split(';')) {
    const [key, value] = part.trim().split('=')
    if (key === name && value !== undefined) return decodeURIComponent(value)
  }
  return null
}

/**
  Force-refreshes the KV calendar cache by fetching directly from Google Calendar.
  Authenticates via the `key` query parameter on first use; subsequent requests
  may use the admin_key cookie set on successful authentication.
  Redirects to the homepage on success.

  @example
  GET /admin/refresh?key=YOUR_ADMIN_KEY
**/
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const { searchParams } = new URL(request.url)
  const cookieHeader = request.headers.get('Cookie') ?? ''
  const cookieKey = getCookie(cookieHeader, COOKIE_NAME)
  const queryKey = searchParams.get('key')

  const key = queryKey ?? cookieKey

  if (key !== env.ADMIN_KEY) {
    return new Response('Unauthorized', { status: 401 })
  }

  await refreshKv(env)

  const headers = new Headers({ Location: '/' })

  if (queryKey !== null) {
    headers.set(
      'Set-Cookie',
      `${COOKIE_NAME}=${encodeURIComponent(key)}; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Strict; Path=/admin/refresh`
    )
  }

  return new Response(null, { status: 302, headers })
}
