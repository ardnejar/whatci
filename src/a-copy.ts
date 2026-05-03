import { LitElement, css, html, type CSSResult, type TemplateResult } from 'lit'
import { property, query } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import copyIcon from '../content/icons/copy-icon.svg?raw'

/*

Assets in public directory cannot be imported from JavaScript.
If you intend to import that asset, put the file in the src directory, and use /src/copy-icon.svg?raw instead of /public/copy-icon.svg?raw.
If you intend to use the URL of that asset, use /copy-icon.svg?url&raw.

*/

/**
  Inline link that copies its resolved href to the clipboard on click
  and shows a confirmation popover above itself using the Popover API
  and CSS Anchor Positioning.

  @example
  <a-copy href="/ical" message="iCal link copied">ical URL</a-copy>
**/
export class ACopy extends LitElement {
  @property() href = ''
  @property() copy = ''
  @property() message = 'Link copied'

  @query('[popover]') private _popover!: HTMLDivElement

  static styles: CSSResult = css`
    :host {
      display: inline;
    }
    a {
      background: #1e1e1e;
      padding: 0.15em 0.4em;
      border-radius: 3px;
      color: var(--link-color, inherit);
      anchor-name: --copy-anchor;
      display: inline-flex;
      align-items: center;
      gap: 0.25em;
    }
    svg {
      display: inline-block;
      flex-shrink: 0;
      vertical-align: -0.1em;
      opacity: 0.6;
    }
    a:hover svg {
      opacity: 1;
    }
    [popover] {
      position: fixed;
      position-anchor: --copy-anchor;
      position-area: top;
      margin: 0 0 8px;
      padding: 0.5rem 1.25rem;
      border: none;
      border-radius: 6px;
      max-width: min(350px, 90vw);
      background: #ffbe64;
      color: #000;
      font-family: inherit;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      overflow: visible;
    }
    [popover]::after {
      content: '';
      position: absolute;
      bottom: -7px;
      left: 50%;
      transform: translateX(-50%);
      border: 7px solid transparent;
      border-bottom: none;
      border-top-color: #ffbe64;
    }
    .tile {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.1em;
    }
    .message {
      font-weight: unset;
      font-size: 1rem;
    }
  `

  private async _handleClick(event: MouseEvent): Promise<void> {
    event.preventDefault()
    const text_to_copy = this.copy || new URL(this.href, location.href).href
    await navigator.clipboard.writeText(text_to_copy)
    this._showPopover()
  }

  private _showPopover(): void {
    this._popover.showPopover()
  }

  render(): TemplateResult {
    return html`
      <a href="${this.href}" @click="${this._handleClick}">
        <slot></slot>
        ${unsafeHTML(copyIcon)}
      </a>
      <div popover>
        <div class="tile">URL copied</div>
        <div class="message">${this.message}</div>
      </div>
    `
  }
}

customElements.define('a-copy', ACopy)
