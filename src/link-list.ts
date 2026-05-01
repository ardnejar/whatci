import { LitElement, html, css, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators.js'

import links from '../content/links.json'
import './link-item.js'

interface LinkEntry {
  label: string
  url: string
  description?: string
  redirect?: boolean
  webpage?: boolean
}

@customElement('link-list')
export class LinkList extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
    }
    link-item + link-item {
      border-top: 1px solid #333;
    }
    h2 {
      margin-bottom: 1rem;
      font-size: 1.5rem;
      font-weight: 1000;
      color: var(--highlight-color);
    }
    @media (prefers-color-scheme: light) {
      link-item + link-item {
        border-top-color: #e0e0e0;
      }
    }
  `

  render(): TemplateResult {
    return html`
      <h2>Resources and Subscription Links</h2>

      ${Object.entries(links as Record<string, LinkEntry>)
        .filter(([, entry]) => entry.webpage)
        .map(
          ([slug, entry]) => html`
            <link-item
              slug="${slug}"
              label="${entry.label}"
              url="${entry.url}"
              description="${entry.description ?? ''}"
            ></link-item>
          `
        )}
    `
  }
}
