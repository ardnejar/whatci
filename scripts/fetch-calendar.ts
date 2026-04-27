/// <reference types="node" />
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

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

const outDir = join(import.meta.dirname, '..', 'test', 'output')
await mkdir(outDir, { recursive: true })

const outFile = join(outDir, 'calendar-events.json')
await writeFile(outFile, body, 'utf-8')

console.log(`Saved to ${outFile}`)
