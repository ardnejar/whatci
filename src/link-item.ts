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
            background: #ffffff;
            padding: 1.2rem 2rem 2rem 0.4rem;
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
        .short {
            font-family: ui-monospace, monospace;
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
        button {
            padding: 0.25rem 0.6rem;
            font-size: 0.75rem;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            background: #f3f3f3;
            color: #555;
            cursor: pointer;
            white-space: nowrap;
            transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        button:hover { background: #e8e8e8; }
        button.copied { background: #d4f5e2; color: #1a7a43; border-color: #a8dfc0; }
        button[hidden] { display: none; }
        @media (prefers-color-scheme: dark) {
            :host { background: #000; }
            .note { color: #aaa; }
            span.short { color: #aaa; }
            a.destination { color: #6ea8ff; }
            button { background: #1a1a1a; border-color: #333; color: #aaa; }
            button:hover { background: #222; }
            button.copied { background: #0d2b1a; color: #4caf7d; border-color: #1a4a2e; }
        }
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
            ${this._copied ? '✓ copied' : 'copy link'}
            </button>
            <button class="share" ?hidden="${!navigator.share}" @click="${this._share}">share</button>
        </div>
        `;
    }
}

customElements.define('link-item', LinkItem);
