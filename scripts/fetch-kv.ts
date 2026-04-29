/// <reference types="node" />
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { CalendarEvent } from '../src/core/types.ts'
import { loadDevVars } from './lib/loadDevVars.ts'
import { parseDateArgs } from './lib/parseDateArgs.ts'

await loadDevVars()

const date_args = new parseDateArgs()

const time_min = date_args.from()
const time_max = date_args.to()

const is_remote = process.argv.includes('--remote')

let base_url: string
if (is_remote) {
  base_url = 'https://whatci.org'
} else {
  const port = process.env.WRANGLER_PORT
  if (!port) {
    console.error('WRANGLER_PORT is not set. Run the wrangler dev server first, or use --remote.')
    process.exit(1)
  }
  base_url = `http://localhost:${port}`
}

if (!is_remote) {
  const admin_token = process.env.ADMIN_TOKEN
  if (!admin_token) {
    console.error('ADMIN_TOKEN is not set in .dev.vars — cannot refresh KV.')
    process.exit(1)
  }
  const refresh_url = `${base_url}/admin/refresh?token=${encodeURIComponent(admin_token)}`
  const refresh_start = Date.now()
  const refresh_res = await fetch(refresh_url, { redirect: 'manual' })
  const refresh_ms = Date.now() - refresh_start
  if (refresh_res.status !== 302 && refresh_res.status !== 200) {
    const body = await refresh_res.text()
    console.error(`KV refresh failed: ${refresh_res.status} ${refresh_res.statusText}\n${body}`)
    process.exit(1)
  }
  console.log(`KV refresh: ${refresh_ms}ms`)
}

const fetch_start = Date.now()
const response = await fetch(`${base_url}/calendar-events`)
if (!response.ok) {
  const body = await response.text()
  console.error(`Request failed: ${response.status} ${response.statusText}\n${body}`)
  process.exit(1)
}

const body = await response.text()
const fetch_ms = Date.now() - fetch_start

let events: CalendarEvent[] = JSON.parse(body) as CalendarEvent[]

if (time_min || time_max) {
  events = events.filter((e) => {
    const start = new Date(e.startDate)
    if (time_min && start < time_min) return false
    if (time_max && start > time_max) return false
    return true
  })
}

const out_dir = join(import.meta.dirname, '..', 'test', 'output')
await mkdir(out_dir, { recursive: true })

const out_file = join(out_dir, 'calendar-events.json')
const out_body = JSON.stringify(events, null, 2)
const write_start = Date.now()
await writeFile(out_file, out_body, 'utf-8')
const write_ms = Date.now() - write_start

const size_bytes = Buffer.byteLength(body, 'utf-8')
const size_str =
  size_bytes >= 1024 * 1024 ? `${(size_bytes / (1024 * 1024)).toFixed(2)} MB` : `${(size_bytes / 1024).toFixed(1)} KB`

console.log(`Events: ${events.length} | Fetch: ${fetch_ms}ms | Download: ${size_str} | Write: ${write_ms}ms`)
console.log(`Saved to ${out_file}\n`)
