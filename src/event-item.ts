import { css, html, LitElement, type TemplateResult } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import { formatDayShort, formatEventDate, formatTime } from './core/event-utils'
import { type CalendarEvent } from './EventStore'

@customElement('event-item')
export class EventItem extends LitElement {
  @property({ attribute: false }) event!: CalendarEvent
  private renderDescription(description: string): TemplateResult {
    const title = this.event.descriptionTitle
    const el = document.createElement('div')
    el.innerHTML = description.trim()
    const plain = el.textContent ?? ''
    if (title !== null) {
      return html`Details at <a href="${description.trim()}" target="_blank" rel="noopener">${title}</a>`
    }
    return html`${plain}`
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
      <div class="event-details">
        <time class="date" datetime="${is_multi_day ? e.startDate.slice(0, 10) : e.startDate}">${time_str}</time>
        <div class="detail-body">
          ${location ? html`<address class="detail-location">${location}</address>` : ''}
          ${e.description ? html`<p class="detail-desc">${this.renderDescription(e.description)}</p>` : ''}
        </div>
      </div>
    `
  }

  render(): TemplateResult {
    const e = this.event
    return html`
      <details>
        <summary class="event-card">
          <time class="date" datetime="${e.startDate.slice(0, 10)}">${formatDayShort(e.startDate)}</time>
          <span class="summary">${e.summary}</span>
        </summary>
        ${this.renderDetails()}
      </details>
    `
  }

  static styles = css`
    :host {
      display: contents;
    }
    details {
      width: 100%;
    }
    summary.event-card {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      padding: 0.3rem 0;
      cursor: pointer;
      font: inherit;
      color: inherit;
      list-style: none;
      width: 100%;
    }
    summary.event-card::-webkit-details-marker {
      display: none;
    }
    details > summary.event-card:hover,
    details[open] > summary.event-card,
    .event-details {
      background-color: #303030;
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
      padding: 0.2rem 0 0.4rem;
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
      min-width: 0;
      overflow-x: auto;
    }
    .detail-location,
    .detail-desc {
      margin: 0;
      font-style: normal;
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
