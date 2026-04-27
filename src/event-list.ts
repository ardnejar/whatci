import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import { CalendarFetchApi } from './calendar-fetch-api'
import { type LocationFilter } from './core/types'
import { type CalendarEvent, EventStore } from './EventStore'

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
    this.what_events = EventStore.loadForLocation(this.location)
    console.log('Loaded G events', this.what_events.length, this.what_events)
    this.requestUpdate()
  }

  get what_list() {
    const count = this.calendarFetcherAPI.eventCount
    if (count === null) return html`<p class="empty">Not loaded</p>`
    if (count === 0) return html`<p class="empty">No upcoming events found.</p>`
    return html`<what-summary .events=${this.what_events}></what-summary>`
  }

  render() {
    return html`${this.what_list}`
  }

  static styles = css`
    :host {
      display: block;
      border-radius: 8px;
      padding: 0 16px 0 16px;
    }
    .empty {
      color: #888;
      font-style: italic;
    }
  `
}
