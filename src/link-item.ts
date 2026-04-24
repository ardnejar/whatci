import { LitElement, html, css, nothing, type CSSResult, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';

export class LinkItem extends LitElement {
    @property() slug = '';
    @property() label = '';
    @property() url = '';
    @property() note = '';

    @property({ type: Boolean }) private _copied = false;

    static styles: CSSResult = css`
        :host {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: #fff;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            flex-wrap: nowrap;
            flex-direction: column;
            align-items: flex-start;
        }
        a.destination {
            font-weight: 600;
            font-size: 1.2rem;
            color: #0057d8;
            text-decoration: none;
        }
        a.destination:hover { text-decoration: underline; }
        a.short {
            font-family: ui-monospace, monospace;
            color: #555;
            font-size: 0.875rem;
            text-decoration: none;
            word-break: break-all;
        }
        .actions {
            display: flex;
            align-items: center;
            width: 100%;
            gap: 0.5rem;
        }
        span.short {
            flex: 1;
        }
        .copy {
            padding: 0.25rem 0.6rem;
            font-size: 0.75rem;
            font-family: ui-monospace, monospace;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            background: #f3f3f3;
            color: #555;
            cursor: pointer;
            white-space: nowrap;
            transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .copy:hover { background: #e8e8e8; }
        .copy.copied { background: #d4f5e2; color: #1a7a43; border-color: #a8dfc0; }
        .share {
            padding: 0.25rem 0.6rem;
            font-size: 0.75rem;
            font-family: ui-monospace, monospace;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            background: #f3f3f3;
            color: #555;
            cursor: pointer;
            white-space: nowrap;
            transition: background 0.15s, color 0.15s;
        }
        .share:hover { background: #e8e8e8; }
        .share[hidden] { display: none; }
    `;

    private async _copy(): Promise<void> {
        await navigator.clipboard.writeText(`${location.origin}/${this.slug}`);
        this._copied = true;
        setTimeout(() => { this._copied = false; }, 1500);
    }

    private async _share(): Promise<void> {
        await navigator.share({
            title: this.label,
            url: `${location.origin}/${this.slug}`,
        });
    }

    render(): TemplateResult {
        return html`
        <a class="destination" href="${this.slug}" target="_blank" rel="noopener noreferrer">${this.label}</a>
        ${this.note ? html`<span class="note">${this.note}</span>` : nothing}
        <div class="actions">
            <span class="short">/${this.slug}</span>
            <button class="copy ${this._copied ? 'copied' : ''}" @click="${this._copy}">
            ${this._copied ? '✓ copied' : 'copy short link'}
            </button>
            <button class="share" ?hidden="${!navigator.share}" @click="${this._share}">share</button>
        </div>
        `;
    }
}

customElements.define('link-item', LinkItem);
