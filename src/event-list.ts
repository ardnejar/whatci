import { css, html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'

import { CalendarFetchApi } from './calendar-fetch-api'
import { type CalendarEvent } from './core/types'
import './event-item'

@customElement('event-list')
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
    this.events = this.api.get('merged', now, this.endOfMonthOffset(this.months_shown + 1))
  }

  private get visibleEvents(): CalendarEvent[] {
    const end_date = this.endOfMonthOffset(this.months_shown + 1)
    return this.events.filter((e) => new Date(e.startDate) <= end_date)
  }

  private get hasMore(): boolean {
    const now = new Date()
    return this.api.get('merged', now, this.endOfMonthOffset(this.months_shown + 2)).length > this.visibleEvents.length
  }

  private endOfMonthOffset(offset: number): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + offset, 0, 23, 59, 59, 999)
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
            ${(() => {
              const day_counts = new Map<string, number>()
              return month_events.map((event) => {
                const is_multi_day = event.startDate.slice(0, 10) !== event.endDate.slice(0, 10)
                const day_key = `${event.startDate.slice(0, 10)}:${is_multi_day}`
                const order = (day_counts.get(day_key) ?? 0) + 1
                day_counts.set(day_key, order)
                return html`<li><event-item .event=${event} day-order="${order}"></event-item></li>`
              })
            })()}
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
      font-size: 1.8rem;
      font-weight: 600;
      margin: 1.25rem 0 0.4rem;
      color: var(--datetime-color);
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
      color: var(--link-color);
      padding: 0;
    }
    .more:hover {
      text-decoration: underline;
    }
  `
}
