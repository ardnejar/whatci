import { CSSResult, html, LitElement, unsafeCSS, type TemplateResult } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { customElement, property } from 'lit/decorators.js'

import { formatDateRange, formatWeekdayRange, formatDayShort, formatTimePair } from './core/event-utils'
import { type CalendarEvent } from './core/types'

import styles from './event-item.css?inline'

const URL_RE = /https?:\/\/\S+/g
const TRAILING_PUNCT_RE = /[.,;:!?)]+$/

/**
  Convert plain-text description and its associated links into an HTML string.
  URLs in the text are replaced with anchor tags using titles from the link map.
  Links whose URL only appeared in an href (not in the visible text) are appended at the end.
**/
function buildDescriptionHtml(description: string, descriptionLinks: CalendarEvent['descriptionLinks']): string {
  const link_map = new Map((descriptionLinks ?? []).map((l) => [l.url, l.title]))
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const parts: string[] = []
  const urls_in_text = new Set<string>()
  let last = 0
  let m: RegExpExecArray | null
  URL_RE.lastIndex = 0

  while ((m = URL_RE.exec(description)) !== null) {
    const raw = m[0]
    const url = raw.replace(TRAILING_PUNCT_RE, '')
    const trailing = raw.slice(url.length)
    urls_in_text.add(url)
    parts.push(esc(description.slice(last, m.index)))
    const title = link_map.get(url)
    parts.push(title ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(title)}</a>${esc(trailing)}` : esc(raw))
    last = m.index + raw.length
  }
  parts.push(esc(description.slice(last)))

  const extra_links = (descriptionLinks ?? []).filter((l) => !urls_in_text.has(l.url))
  if (extra_links.length > 0) {
    const links_html = extra_links
      .map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)}</a>`)
      .join(', ')
    if (parts.join('').trim()) parts.push(`<br>${links_html}`)
    else parts.push(links_html)
  }

  return parts.join('').replace(/\n/g, '<br>')
}

@customElement('event-item')
export class EventItem extends LitElement {
  @property({ attribute: false }) event!: CalendarEvent
  @property({ type: Number, attribute: 'day-order' }) dayOrder = 1

  static styles: CSSResult = unsafeCSS(styles)

  private renderDescription(): TemplateResult {
    const { description, descriptionLinks } = this.event
    if (!description) return html``
    return html`${unsafeHTML(buildDescriptionHtml(description, descriptionLinks))}`
  }

  private renderDetails(): TemplateResult {
    const e = this.event
    const is_all_day = !e.startDate.includes('T')
    const location = e.location
      ? e.location.startsWith('http')
        ? html`<a href="${e.location}" target="_blank" rel="noopener">Online Event</a>`
        : html`<span>${e.location}</span>`
      : null

    let time_display
    if (!is_all_day) {
      const [start_text, end_text] = formatTimePair(e.startDate, e.endDate)
      time_display = html`<time datetime="${e.startDate}">${start_text}</time>–<time datetime="${e.endDate}">${end_text}</time>`
    }

    return html`
      <div class="event-details">
        <span class="time">${time_display}</span>
        <div class="detail-body">
          ${location ? html`<address class="detail-location">${location}</address>` : ''}
          ${e.description ? html`<p class="detail-description">${this.renderDescription()}</p>` : ''}
        </div>
      </div>
    `
  }

  render(): TemplateResult {
    const e = this.event
    const is_multi_day = e.startDate.slice(0, 10) !== e.endDate.slice(0, 10)
    let date_display

    if (is_multi_day) {
      const day_part = formatDateRange(e.startDate, e.endDate)
      const week_part = formatWeekdayRange(e.startDate, e.endDate)
      date_display = html`<span class="nowrap">${day_part}</span> <span class="nowrap">${week_part}</span>`
    } else {
      date_display = formatDayShort(e.startDate)
    }

    return html`
      <details>
        <summary class="event-summary">
          <time class="date" day-order="${this.dayOrder}" datetime="${e.startDate}">${date_display}</time>
          <span class="summary">${e.summary}</span>
        </summary>
        ${this.renderDetails()}
      </details>
    `
  }
}
