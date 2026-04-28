/// <reference types="node" />
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { loadDevVars } from './lib/loadDevVars.ts'
import { parseDateArgs } from './lib/parseDateArgs.ts'

await loadDevVars()

const calendar_id = process.env.CALENDAR_ID
const api_key = process.env.GOOGLE_API_KEY

if (!calendar_id || !api_key) {
  console.error('CALENDAR_ID and GOOGLE_API_KEY must be set in .dev.vars or environment.')
  process.exit(1)
}

const date_args = new parseDateArgs()

const time_min = date_args.from() ?? new Date()
const time_max = date_args.to()

const url =
  `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar_id)}/events` +
  `?key=${api_key}` +
  `&maxResults=2500` +
  `&singleEvents=true` +
  `&timeMin=${encodeURIComponent(time_min.toISOString())}` +
  (time_max ? `&timeMax=${encodeURIComponent(time_max.toISOString())}` : '') +
  `&orderBy=startTime`

const fetch_start = Date.now()
const response = await fetch(url)
if (!response.ok) {
  const body = await response.text()
  console.error(`Google Calendar API error: ${response.status} ${response.statusText}\n${body}`)
  process.exit(1)
}

const raw_body = await response.text()
const fetch_ms = Date.now() - fetch_start
const data = JSON.parse(raw_body)

const out_dir = join(import.meta.dirname, '..', 'test', 'output')
await mkdir(out_dir, { recursive: true })

const out_file = join(out_dir, 'google-calendar-raw.json')
const write_start = Date.now()
await writeFile(out_file, JSON.stringify(data, null, 2), 'utf-8')
const write_ms = Date.now() - write_start

const size_bytes = Buffer.byteLength(raw_body, 'utf-8')
const size_str =
  size_bytes >= 1024 * 1024 ? `${(size_bytes / (1024 * 1024)).toFixed(2)} MB` : `${(size_bytes / 1024).toFixed(1)} KB`
const event_count = Array.isArray(data.items) ? data.items.length : 0

console.log(`Saved to ${out_file}`)
console.log(`Events: ${event_count} | Download: ${size_str} | Request: ${fetch_ms}ms | Write: ${write_ms}ms\n`)
