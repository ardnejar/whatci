/**
  HTML rendering utilities for event lists
  Uses Lit's html template syntax for consistency
**/

import { html, type TemplateResult } from 'lit'

import { formatEventDate, maybeRecurringLabel } from './event-utils'
import { type CalendarEvent } from './types'

/**
  Render events as a summary table (Lit template)
**/
export function renderEventsSummaryTable(events: CalendarEvent[]): TemplateResult {
  return html`
    <table id="what-summary">
      ${events.map(
        (event) => html`
          <tr>
            <td class="date" style="width:6rem;">
              <time datetime="${event.startDate}">${formatEventDate(event)}</time>
            </td>
            <td class="summary" style="width:calc(100% - 6rem);">
              ${event.summary}
              <span style="font-style: italic;"> ${maybeRecurringLabel(event)} </span>
            </td>
          </tr>
        `
      )}
    </table>
  `
}

/**
  Render events as plain text summary
**/
export function renderEventsSummaryText(events: CalendarEvent[]): string {
  return events
    .map((event) => {
      const date_string = formatEventDate(event)
      const is_short_date = date_string.length <= 7
      const tab_if_short_date = is_short_date ? '\t' : ''
      const recurring = maybeRecurringLabel(event)
      return `${date_string}${tab_if_short_date}\t${event.summary}${recurring}\n`
    })
    .join('')
}

/**
  Render events as HTML string (for server-side rendering)
**/
export function renderEventsSummaryHtml(events: CalendarEvent[]): string {
  const rows = events
    .map((event) => {
      const date_string = formatEventDate(event)
      const recurring = maybeRecurringLabel(event)
      return `
      <tr>
        <td class="date" style="width:6rem;">
          <time datetime="${event.startDate}">${date_string}</time>
        </td>
        <td class="summary" style="width:calc(100% - 6rem);">
          ${event.summary}
          <span style="font-style: italic;">${recurring}</span>
        </td>
      </tr>`
    })
    .join('')

  return `<table id="what-summary">${rows}</table>`
}
