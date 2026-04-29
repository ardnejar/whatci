import { css, html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'

import { CalendarFetchApi } from './calendar-fetch-api'
import { type CalendarEvent } from './EventStore'
import './event-item'

@customElement('event-details')
export class EventDetails extends LitElement {
  @state() private events: CalendarEvent[] = []
  @state() private months_shown = 1

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
    const end_date = new Date(now.getFullYear(), now.getMonth() + this.months_shown + 1, 0, 23, 59, 59, 999)
    this.events = this.api.get('merged', now, end_date)
  }

  private get visibleEvents(): CalendarEvent[] {
    const now = new Date()
    const end_date = new Date(now.getFullYear(), now.getMonth() + this.months_shown + 1, 0, 23, 59, 59, 999)
    return this.events.filter((e) => new Date(e.startDate) <= end_date)
  }

  private get hasMore(): boolean {
    const now = new Date()
    const next_end = new Date(now.getFullYear(), now.getMonth() + this.months_shown + 2, 0, 23, 59, 59, 999)
    return this.api.get('merged', now, next_end).length > this.visibleEvents.length
  }

  private showMore() {
    this.months_shown++
    this.loadEvents()
  }

  private groupByMonth(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
    const groups = new Map<string, CalendarEvent[]>()
    for (const event of events) {
      const key = new Date(event.startDate).toLocaleString('en-US', { month: 'long', year: 'numeric' })
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(event)
    }
    return groups
  }

  render() {
    if (this.api.eventCount === null) return html`<p class="empty">Loading…</p>`
    const visible = this.visibleEvents
    if (visible.length === 0) return html`<p class="empty">No upcoming events found.</p>`

    const groups = this.groupByMonth(visible)

    return html`
      ${[...groups.entries()].map(
        ([month, month_events]) => html`
          <h3 class="month-header">${month}</h3>
          <div class="event-group">${month_events.map((event) => html`<event-item .event=${event}></event-item>`)}</div>
        `
      )}
      ${this.hasMore ? html`<button class="more" @click=${this.showMore.bind(this)}>More...</button>` : ''}
    `
  }

  static styles = css`
    :host {
      display: block;
    }
    .empty {
      color: #888;
      font-style: italic;
    }
    .month-header {
      font-size: 1rem;
      font-weight: 600;
      margin: 1.25rem 0 0.4rem;
      color: inherit;
    }
    .event-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .event-card {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.3rem 0;
      text-align: left;
      font: inherit;
      color: inherit;
      width: 100%;
    }
    .more {
      margin-top: 1rem;
      background: none;
      border: none;
      cursor: pointer;
      font: inherit;
      color: #0057d8;
      padding: 0;
    }
    .more:hover {
      text-decoration: underline;
    }
    @media (prefers-color-scheme: dark) {
      .more {
        color: #6ea8ff;
      }
    }
  `
}
