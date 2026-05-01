import { css, html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'

import { CalendarFetchApi } from './calendar-fetch-api'
import { renderEventsSummaryTable, renderEventsSummaryText } from './core/renderer'
import { type CalendarEvent } from './core/types'

@customElement('event-copy')
export class EventCopy extends LitElement {
  @state() private events: CalendarEvent[] = []

  private api = new CalendarFetchApi()

  connectedCallback() {
    super.connectedCallback()
    this.loadEvents()
    window.addEventListener('calendar-updated', this.loadEvents.bind(this))
    this.api.fetch().catch((err) => console.error('Calendar fetch failed:', err))
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('calendar-updated', this.loadEvents.bind(this))
  }

  private loadEvents = () => {
    const now = new Date()
    const end_date = new Date(now.getFullYear(), now.getMonth() + 3, 0)
    this.events = this.api.get('first-occurrences', now, end_date)
  }

  get text_content() {
    return renderEventsSummaryText(this.events)
  }

  render() {
    if (this.api.eventCount === null) return html`<p class="empty">Loading…</p>`
    if (this.events.length === 0) return html`<p class="empty">No upcoming events found.</p>`
    return html`${renderEventsSummaryTable(this.events)}`
  }

  static styles = css`
    .empty {
      color: #888;
      font-style: italic;
    }
    .date {
      color: #555;
      font-size: 1rem;
    }
    .summary {
      font-size: 1rem;
    }
  `
}
