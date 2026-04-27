import * as EventUtils from './core/event-utils'
import { type CalendarEvent } from './core/types'

export { type CalendarEvent } from './core/types'

export class EventStore {
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
