import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import type { CalendarEvent } from '../src/core/types.ts'

/**
  Structural validation of test/output/calendar-events.json — the file written
  by `npm run fetch-kv`. These tests confirm the script ran successfully and
  that description processing (stripping HTML, extracting links) behaved as expected.

  Run `npm run fetch-kv` to refresh the file before running these tests.
**/

const OUTPUT_FILE = join(import.meta.dirname, 'output/calendar-events.json')

let events: CalendarEvent[]
try {
  events = JSON.parse(readFileSync(OUTPUT_FILE, 'utf-8')) as CalendarEvent[]
} catch {
  throw new Error(`calendar-events.json not found — run \`npm run fetch-kv\` first`)
}

describe('fetch-kv output (calendar-events.json)', () => {
  it('contains at least one event', () => {
    expect(events.length).toBeGreaterThan(0)
  })

  it('every event has required fields with correct types', () => {
    for (const event of events) {
      expect(typeof event.summary).toBe('string')
      expect(event.summary.length).toBeGreaterThan(0)
      expect(typeof event.startDate).toBe('string')
      expect(typeof event.endDate).toBe('string')
      expect(typeof event.uid).toBe('string')
      expect(typeof event.isRecurring).toBe('boolean')
    }
  })

  it('events without descriptionRaw have null description and links', () => {
    const without_raw = events.filter((e) => e.descriptionRaw === null)
    for (const event of without_raw) {
      expect(event.description).toBeNull()
      expect(event.descriptionLinks).toBeNull()
    }
  })

  it('events with descriptionRaw have a non-empty plain-text description', () => {
    const with_raw = events.filter((e) => e.descriptionRaw !== null)
    expect(with_raw.length).toBeGreaterThan(0)
    for (const event of with_raw) {
      expect(typeof event.description).toBe('string')
      expect((event.description as string).length).toBeGreaterThan(0)
    }
  })

  it('description contains no HTML tags (plain text after stripping)', () => {
    for (const event of events) {
      if (event.description) {
        expect(event.description).not.toMatch(/<[a-z]/i)
      }
    }
  })

  it('events whose raw description contains a URL have at least one link', () => {
    const url_re = /https?:\/\/\S+/
    const with_url = events.filter((e) => e.descriptionRaw && url_re.test(e.descriptionRaw))
    expect(with_url.length).toBeGreaterThan(0)
    for (const event of with_url) {
      expect(Array.isArray(event.descriptionLinks)).toBe(true)
      expect((event.descriptionLinks as unknown[]).length).toBeGreaterThan(0)
    }
  })

  it('each link has a non-empty url and title', () => {
    for (const event of events) {
      for (const link of event.descriptionLinks ?? []) {
        expect(link.url).toMatch(/^https?:\/\//)
        expect(typeof link.title).toBe('string')
        expect(link.title.length).toBeGreaterThan(0)
      }
    }
  })
})
