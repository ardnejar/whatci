import type { Env } from './lib/google-calendar.ts'
import { maybeRenewWatchChannel, refreshKv } from './lib/google-calendar.ts'

/**
  Receives Google Calendar push notifications and immediately refreshes the KV cache.
  Authenticates via X-Goog-Channel-Token matched against ADMIN_KEY.
  The initial sync message sent on channel registration is acknowledged without
  triggering a refresh.

  @example
  POST /calendar-webhook
**/
export const onRequestPost = async ({
  request,
  env,
  waitUntil,
}: {
  request: Request
  env: Env
  waitUntil: (promise: Promise<unknown>) => void
}): Promise<Response> => {
  const channel_token = request.headers.get('X-Goog-Channel-Token')
  if (channel_token !== env.ADMIN_KEY) {
    console.log('[calendar-webhook] Unauthorized — token mismatch')
    return new Response('Unauthorized', { status: 401 })
  }

  const resource_state = request.headers.get('X-Goog-Resource-State')
  if (resource_state === 'sync') {
    console.log('[calendar-webhook] Sync message received — acknowledged, no refresh')
  } else {
    console.log(`[calendar-webhook] Push notification received (resource_state=${resource_state}) — triggering refresh`)
    waitUntil(refreshKv(env))
    waitUntil(maybeRenewWatchChannel(env))
  }

  return new Response(null, { status: 200 })
}
