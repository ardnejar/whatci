import { css, html, LitElement, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import { formatDayShort, formatEventDate, formatTime } from './core/event-utils'
import { type CalendarEvent } from './EventStore'

@customElement('event-item')
export class EventItem extends LitElement {
  @property({ attribute: false }) event!: CalendarEvent
  @state() private is_open = false

  private toggle() {
    this.is_open = !this.is_open
  }

  private renderDescription(description: string): TemplateResult {
    const title = this.event.descriptionTitle
    if (title !== null) {
      return html`<a href="${description.trim()}" target="_blank" rel="noopener">Details at ${title}</a>`
    }
    return html`${description.trim()}`
  }

  private renderDetails(): TemplateResult {
    const e = this.event
    const is_multi_day = e.startDate.slice(0, 10) !== e.endDate.slice(0, 10)
    const time_str = is_multi_day ? `${formatEventDate(e)}` : `${formatTime(e.startDate)}–${formatTime(e.endDate)}`
    const location = e.location
      ? e.location.startsWith('http')
        ? html`<a href="${e.location}" target="_blank" rel="noopener">Online Event</a>`
        : html`<span>${e.location}</span>`
      : null

    return html`
      <button class="event-details" @click=${this.toggle.bind(this)}>
        <span class="date">${time_str}</span>
        <span class="detail-body">
          ${location ? html`<span class="detail-location">${location}</span>` : ''}
          ${e.description ? html`<span class="detail-desc">${this.renderDescription(e.description)}</span>` : ''}
        </span>
      </button>
    `
  }

  render(): TemplateResult {
    const e = this.event
    return html`
      <button class="event-card" @click=${this.toggle.bind(this)} aria-expanded=${this.is_open}>
        <span class="date">${formatDayShort(e.startDate)}</span>
        <span class="summary">${e.summary}</span>
      </button>
      ${this.is_open ? this.renderDetails() : ''}
    `
  }

  static styles = css`
    :host {
      display: contents;
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
    .detail-location a,
    .detail-desc a {
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
      .event-details .date {
        color: #aaa;
      }
      .detail-body {
        color: #aaa;
      }
      .detail-location a,
      .detail-desc a {
        color: #6ea8ff;
      }
    }
  `
}
