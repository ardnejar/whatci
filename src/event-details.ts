import { css, html, LitElement, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'

import { CalendarFetchApi } from './calendar-fetch-api'
import { formatDayShort, formatEventDate, formatTime } from './core/event-utils'
import { type CalendarEvent } from './EventStore'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'

@customElement('event-details')
export class EventDetails extends LitElement {
  @state() private events: CalendarEvent[] = []
  @state() private months_shown = 1
  @state() private expanded_uids: Set<string> = new Set()

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

  private toggleEvent(uid: string) {
    const next = new Set(this.expanded_uids)
    if (next.has(uid)) {
      next.delete(uid)
    } else {
      next.add(uid)
    }
    this.expanded_uids = next
  }

  private renderEventDetails(e: CalendarEvent): TemplateResult {
    const is_multi_day = e.startDate.slice(0, 10) !== e.endDate.slice(0, 10)
    const time_str = is_multi_day
      ? `${formatEventDate(e)}`
      : `${formatTime(e.startDate)}–${formatTime(e.endDate)}`
    const location = e.location
      ? e.location.startsWith('http')
        ? html`<a href="${e.location}" target="_blank" rel="noopener">${e.location}</a>`
        : html`<span>${e.location}</span>`
      : null

    return html`
      <button class="event-details" @click=${() => this.toggleEvent(e.uid)}>
        <span class="date">${time_str}</span>
        <span class="detail-body">
          ${location ? html`<span class="detail-location">${location}</span>` : ''}
          ${e.description ? html`<span class="detail-desc">${unsafeHTML(e.description)}</span>` : ''}
        </span>
      </button>
    `
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
          <div class="event-group">
            ${month_events.map(
              (event) => html`
                <button class="event-card" @click=${() => this.toggleEvent(event.uid)} aria-expanded=${this.expanded_uids.has(event.uid)}>
                  <span class="date">${formatDayShort(event.startDate)}</span>
                  <span class="summary">${event.summary}</span>
                </button>
                ${this.expanded_uids.has(event.uid) ? this.renderEventDetails(event) : ''}
              `
            )}
          </div>
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
    .event-card:hover .summary,
    .event-card[aria-expanded='true'] .summary {
      text-decoration: underline;
    }
    .date {
      flex-shrink: 0;
      width: 4.5rem;
      font-size: 0.9rem;
      color: #555;
    }
    .summary {
      font-size: 1rem;
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
    .event-details {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.2rem 0 0.4rem;
      text-align: left;
      font: inherit;
      color: inherit;
      width: 100%;
    }
    .event-details .date {
      color: #555;
    }
    .detail-body {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.9rem;
      color: #555;
    }
    .detail-location a {
      color: #0057d8;
    }
    .detail-desc {
      font-size: 0.9rem;
      line-height: 1.5;
    }
    @media (prefers-color-scheme: dark) {
      .date {
        color: #aaa;
      }
      .more {
        color: #6ea8ff;
      }
      .event-details .date {
        color: #aaa;
      }
      .detail-body {
        color: #aaa;
      }
      .detail-location a {
        color: #6ea8ff;
      }
    }
  `
}
