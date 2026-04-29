import { LitElement, html, nothing, unsafeCSS, type CSSResult, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'
import styles from './link-item.css?inline'

export class LinkItem extends LitElement {
  @property() slug = ''
  @property() label = ''
  @property() url = ''
  @property() description = ''

  @property({ type: Boolean }) private _copied = false

  static styles: CSSResult = unsafeCSS(styles)

  private async _copy(): Promise<void> {
    await navigator.clipboard.writeText(`${location.origin}/${this.slug}`)
    this._copied = true
    setTimeout(() => {
      this._copied = false
    }, 1500)
  }

  private async _share(): Promise<void> {
    await navigator.share({
      title: this.label,
      url: `${location.origin}/${this.slug}`,
    })
  }

  render(): TemplateResult {
    return html`
      <a class="destination" href="${this.slug}" target="_blank" rel="noopener noreferrer">${this.label}</a>
      ${this.description ? html`<span class="description">${this.description}</span>` : nothing}
      <div class="actions">
        <span class="short">/${this.slug}</span>
        <button class="copy ${this._copied ? 'copied' : ''}" @click="${this._copy}">
          ${this._copied ? '✓ copied' : 'copy link'}
        </button>
        <button class="share" ?hidden="${!navigator.share}" @click="${this._share}">share</button>
      </div>
    `
  }
}

customElements.define('link-item', LinkItem)
