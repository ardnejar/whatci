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
    const current_year = new Date().getFullYear()
    for (const event of events) {
      const date = new Date(event.startDate)
      const options: Intl.DateTimeFormatOptions =
        date.getFullYear() === current_year ? { month: 'long' } : { month: 'long', year: 'numeric' }
      const key = date.toLocaleString('en-US', options)
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
          <ul class="event-group">
            ${month_events.map((event) => html`<li><event-item .event=${event}></event-item></li>`)}
          </ul>
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
      color: var(--datetime-light-color);
    }
    .event-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .event-group li {
      display: contents;
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
      .month-header {
        color: var(--datetime-dark-color);
      }
    }
  `
}
