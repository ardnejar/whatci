import { css, html, LitElement, type TemplateResult } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { customElement, property } from 'lit/decorators.js'

import { formatDayRangeShort, formatDayShort, formatTimePair } from './core/event-utils'
import { type CalendarEvent } from './core/types'

@customElement('event-item')
export class EventItem extends LitElement {
  @property({ attribute: false }) event!: CalendarEvent
  @property({ type: Number, attribute: 'day-order' }) dayOrder = 1

  private renderDescription(): TemplateResult {
    const { description, descriptionLinks } = this.event
    if (!description) return html``

    const link_map = new Map((descriptionLinks ?? []).map((l) => [l.url, l.title]))
    const url_re = /https?:\/\/\S+/g
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const parts: string[] = []
    const urls_in_text = new Set<string>()
    let last = 0
    let m: RegExpExecArray | null

    while ((m = url_re.exec(description)) !== null) {
      const raw = m[0]
      const url = raw.replace(/[.,;:!?)]+$/, '')
      const trailing = raw.slice(url.length)
      urls_in_text.add(url)
      parts.push(esc(description.slice(last, m.index)))
      const title = link_map.get(url)
      parts.push(title ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(title)}</a>${esc(trailing)}` : esc(raw))
      last = m.index + raw.length
    }
    parts.push(esc(description.slice(last)))

    // Append links whose URL was only in an href attribute, not visible in the plain text
    const extra_links = (descriptionLinks ?? []).filter((l) => !urls_in_text.has(l.url))
    if (extra_links.length > 0) {
      const links_html = extra_links
        .map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)}</a>`)
        .join(', ')
      if (parts.join('').trim()) parts.push(`<br>${links_html}`)
      else parts.push(links_html)
    }
    return html`${unsafeHTML(parts.join('').replace(/\n/g, '<br>'))}`
  }

  private renderDetails(): TemplateResult {
    const e = this.event
    const is_multi_day = e.startDate.slice(0, 10) !== e.endDate.slice(0, 10)
    const is_all_day = !e.startDate.includes('T')
    const location = e.location
      ? e.location.startsWith('http')
        ? html`<a href="${e.location}" target="_blank" rel="noopener">Online Event</a>`
        : html`<span>${e.location}</span>`
      : null

    let time_display
    if (is_multi_day) {
      if (!is_all_day) {
        const [start_text, end_text] = formatTimePair(e.startDate, e.endDate)
        time_display = html`<time datetime="${e.startDate}">${start_text}</time>–<time datetime="${e.endDate}">${end_text}</time>`
      }
    } else if (!is_all_day) {
      const [start_text, end_text] = formatTimePair(e.startDate, e.endDate)
      time_display = html`<time datetime="${e.startDate}">${start_text}</time>–<time datetime="${e.endDate}">${end_text}</time>`
    }

    return html`
      <div class="event-details">
        <span class="date">${time_display}</span>
        <div class="detail-body">
          ${location ? html`<address class="detail-location">${location}</address>` : ''}
          ${e.description ? html`<p class="detail-desc">${this.renderDescription()}</p>` : ''}
        </div>
      </div>
    `
  }

  render(): TemplateResult {
    const e = this.event
    const is_multi_day = e.startDate.slice(0, 10) !== e.endDate.slice(0, 10)
    let date_display
    if (is_multi_day) {
      const label = formatDayRangeShort(e.startDate, e.endDate)
      const sep = label.indexOf(', ')
      const day_part = label.slice(0, sep + 1)
      const week_part = label.slice(sep + 2)
      date_display = html`<span class="nowrap">${day_part}</span> <span class="nowrap">${week_part}</span>`
    } else {
      date_display = formatDayShort(e.startDate)
    }
    return html`
      <details>
        <summary class="event-card">
          <time class="date" day-order="${this.dayOrder}" datetime="${e.startDate}">${date_display}</time>
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
      background-color: #161616;
    }
    .date {
      flex-shrink: 0;
      width: 5rem;
      font-size: 0.9rem;
      color: var(--datetime-color);
    }
    summary .date:not([day-order='1']) {
      visibility: hidden;
    }
    .nowrap {
      white-space: nowrap;
    }
    .summary {
      font-size: 1rem;
      /* border-bottom: dotted; */
      text-decoration: underline;
      text-decoration-color: hsl(0deg 0% 80%);
      text-decoration-style: dotted;
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
      color: var(--datetime-color);
    }
    .detail-body {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.9rem;
      color: var(--datetime-color);
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
      color: var(--link-color);
    }

    .detail-desc {
      font-size: 0.9rem;
      line-height: 1.5;
    }
    @media (prefers-color-scheme: light) {
      details > summary.event-card:hover,
      details[open] > summary.event-card,
      .event-details {
        background-color: hsl(0 0% 97% / 1);
      }
      .summary {
        text-decoration-color: hsl(0deg 0% 10%);
      }
    }
  `
}
