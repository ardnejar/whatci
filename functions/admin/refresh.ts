import type { Env as CalendarEnv } from '../lib/google-calendar.ts'
import { refreshKv, registerWatchChannel } from '../lib/google-calendar.ts'

interface Env extends CalendarEnv {
  ASSETS: Fetcher
}

/**
  Serves the admin refresh UI (GET) and performs a KV cache refresh (POST).
  Access is controlled by Cloudflare Access (OTP).

  GET  /admin/refresh — serves the static refresh page
  POST /admin/refresh — refreshes the KV cache and watch channel, returns JSON
**/
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  return env.ASSETS.fetch(request)
}

export const onRequestPost = async ({ env }: { env: Env }): Promise<Response> => {
  console.log('[admin/refresh] Refreshing KV cache')
  await refreshKv(env)

  console.log('[admin/refresh] Registering watch channel')
  try {
    await registerWatchChannel(env)
    console.log('[admin/refresh] Watch channel registered successfully')
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.log(`[admin/refresh] Watch channel registration failed: ${error}`)
    return Response.json({ ok: false, error }, { status: 500 })
  }

  return Response.json({ ok: true })
}
