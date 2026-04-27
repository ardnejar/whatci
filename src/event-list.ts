import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import { CalendarFetchApi } from './calendar-fetch-api'
import { type LocationFilter } from './core/types'
import { type CalendarEvent } from './EventStore'

import './what-summary'

@customElement('event-list')
export class EventList extends LitElement {
  @property() location: LocationFilter
  @state() private what_events: CalendarEvent[] = []

  private calendarFetcherAPI = new CalendarFetchApi()

  connectedCallback() {
    super.connectedCallback()
    this.loadEvents()
    window.addEventListener('calendar-updated', this.loadEvents.bind(this))
    this.calendarFetcherAPI.fetch().catch((err) => console.error('Calendar fetch failed:', err))
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('calendar-updated', this.loadEvents.bind(this))
  }

  private loadEvents = () => {
    const now = new Date()
    const end_date = new Date(now.getFullYear(), now.getMonth() + 6, 0)
    this.what_events = this.calendarFetcherAPI.getFirstOccurrences(now, end_date)
    console.log('Loaded G events', this.what_events.length, this.what_events)
    this.requestUpdate()
  }

  get what_list() {
    if (this.calendarFetcherAPI.eventCount === null) return html`<p class="empty">Not loaded</p>`
    if (this.what_events.length === 0) return html`<p class="empty">No upcoming events found.</p>`
    return html`<h2>Jams and Classes</h2>
      <what-summary .events=${this.what_events}></what-summary>`
  }

  render() {
    return html`${this.what_list}`
  }

  static styles = css`
    .empty {
      color: #888;
      font-style: italic;
    }
  `
}
