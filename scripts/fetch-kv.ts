/// <reference types="node" />
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { loadDevVars } from './lib/load-dev-vars.ts'

await loadDevVars()

const port = process.env.WRANGLER_PORT
if (!port) {
  console.error('WRANGLER_PORT is not set. Run the wrangler dev server first.')
  process.exit(1)
}
const url = `http://localhost:${port}/calendar-events`

const response = await fetch(url)
if (!response.ok) {
  const body = await response.text()
  console.error(`Request failed: ${response.status} ${response.statusText}\n${body}`)
  process.exit(1)
}

const body = await response.text()

const out_dir = join(import.meta.dirname, '..', 'test', 'output')
await mkdir(out_dir, { recursive: true })

const out_file = join(out_dir, 'calendar-events.json')
await writeFile(out_file, body, 'utf-8')

console.log(`Saved to ${out_file}`)
