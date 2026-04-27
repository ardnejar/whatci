import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import { renderEventsSummaryTable, renderEventsSummaryText } from './core/renderer'
import { type CalendarEvent, EventStore } from './EventStore'

@customElement('what-summary')
export class WhatSummary extends LitElement {
  @property({ attribute: false }) events: CalendarEvent[] = []

  get html_content() {
    const { html_string: html, plain_text: text } = EventStore.getHtmlAndTextForSelector(
      '#what-summary',
      this.shadowRoot as unknown as ParentNode
    )
    console.log('html_content', html)
    return html || text
  }

  get text_content() {
    const text = renderEventsSummaryText(this.events)
    console.log('text_content', text)
    return text
  }

  render() {
    return html` ${renderEventsSummaryTable(this.events)} `
  }

  static styles = css`
    .date {
      color: #555;
      font-size: 1rem;
    }
    .summary {
      font-size: 1rem;
    }
  `
}
