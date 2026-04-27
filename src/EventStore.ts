import * as EventUtils from './core/event-utils'
import { type CalendarEvent, type LocationFilter } from './core/types'

export { type CalendarEvent } from './core/types'

export class EventStore {
  title = 'Calendar Events'
  store = 'events'

  get lastFetch(): Date | null {
    const lastFetchData = JSON.parse(localStorage.getItem('last_fetch') || '{}')
    const lastFetchString = lastFetchData[this.store]
    if (!lastFetchString) return null
    return new Date(lastFetchString)
  }

  saveLastFetch(): void {
    const lastFetchData = JSON.parse(localStorage.getItem('last_fetch') || '{}')
    lastFetchData[this.store] = new Date()
    localStorage.setItem('last_fetch', JSON.stringify(lastFetchData))
  }

  loadEvents(): CalendarEvent[] {
    const stored = localStorage.getItem(this.store)
    if (!stored) return []
    try {
      const parsed = JSON.parse(stored) as CalendarEvent[]
      return parsed
    } catch (err) {
      console.error(`Failed to parse ${this.store}`, err)
      return []
    }
  }

  saveEvents(events: CalendarEvent[]): void {
    try {
      localStorage.setItem(this.store, JSON.stringify(events))
    } catch (err) {
      console.error(`Failed to save ${this.store}`, err)
    }
  }

  get eventCount(): number | null {
    const stored = localStorage.getItem(this.store)
    if (stored === null) return null
    try {
      const parsed = JSON.parse(stored) as CalendarEvent[]
      return parsed.length
    } catch {
      return null
    }
  }

  static loadForLocation(location: LocationFilter): CalendarEvent[] {
    const store = new EventStore()
    store.store = 'calendar-events'
    const all = store.loadEvents()
    return EventUtils.filterAndMergeEvents(all, location)
  }

  static formatDateShort(date_string: string): string {
    return EventUtils.formatDateShort(date_string)
  }

  static formatEventDate(event: CalendarEvent): string {
    return EventUtils.formatEventDate(event)
  }

  static formatTime(date_string: string): string {
    return EventUtils.formatTime(date_string)
  }

  static formatTimeRange(event: CalendarEvent): string {
    return EventUtils.formatTimeRange(event)
  }

  static maybeRecurringLabel(event: CalendarEvent): string {
    return EventUtils.maybeRecurringLabel(event)
  }

  static stripNewlines(text: string | null | undefined): string {
    return EventUtils.stripNewlines(text)
  }

  /**
    Return HTML and plain text for the first element matching selector within the provided root.
    If not found, returns empty strings.
  **/
  static getHtmlAndTextForSelector(selector: string, root: ParentNode = document): { html_string: string; plain_text: string } {
    try {
      const el = root.querySelector(selector) as HTMLElement | null
      if (!el) return { html_string: '', plain_text: '' }
      const html = this.removeCommentNodes(el.outerHTML)
      const text = el.textContent ? el.textContent.trim() : ''
      console.log(`Text for Selector ${selector}`, { text })
      console.log(`Html for Selector ${selector}`, { html })
      return { html_string: html, plain_text: text }
    } catch (err) {
      console.error('getHtmlAndTextForSelector error', err)
      return { html_string: '', plain_text: '' }
    }
  }

  /**
    Remove all Comment nodes from the provided HTML string and return cleaned HTML string.
  **/
  static removeCommentNodes(html: string): string {
    const template = document.createElement('template')
    template.innerHTML = html
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_COMMENT, null)
    const to_remove: Comment[] = []
    while (walker.nextNode()) {
      to_remove.push(walker.currentNode as Comment)
    }
    to_remove.forEach((c) => c.parentNode?.removeChild(c))
    return template.innerHTML
  }
}
