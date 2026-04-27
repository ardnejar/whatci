/// <reference types="node" />
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { loadDevVars } from './lib/load-dev-vars.ts'

await loadDevVars()

const calendar_id = process.env.CALENDAR_ID
const api_key = process.env.GOOGLE_API_KEY

if (!calendar_id || !api_key) {
  console.error('CALENDAR_ID and GOOGLE_API_KEY must be set in .dev.vars or environment.')
  process.exit(1)
}

const now = new Date()
const url =
  `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar_id)}/events` +
  `?key=${api_key}` +
  `&maxResults=2500` +
  `&singleEvents=true` +
  `&timeMin=${encodeURIComponent(now.toISOString())}` +
  `&orderBy=startTime`

const response = await fetch(url)
if (!response.ok) {
  const body = await response.text()
  console.error(`Google Calendar API error: ${response.status} ${response.statusText}\n${body}`)
  process.exit(1)
}

const data = await response.json()

const out_dir = join(import.meta.dirname, '..', 'test', 'output')
await mkdir(out_dir, { recursive: true })

const out_file = join(out_dir, 'google-calendar-raw.json')
await writeFile(out_file, JSON.stringify(data, null, 2), 'utf-8')

console.log(`Saved to ${out_file}`)
