import { LitElement, css, html, type CSSResult, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'

const raw_svgs = import.meta.glob('../content/icons/*.svg', { query: '?raw', eager: true, import: 'default' }) as Record<
  string,
  string
>

const svg_map: Record<string, string> = Object.fromEntries(
  Object.entries(raw_svgs).map(([path, content]) => [path.replace('../content/icons/', '').replace('.svg', ''), content])
)

/**
  Inline SVG element that bundles and renders SVGs from content/icons/.
  Use the `src` attribute with the icon filename stem (without path or extension).

  Colors are controlled via the `--svg-color` CSS custom property,
  which defaults to white in dark mode and black in light mode.

  @example
  <svg-inline src="monthly-icon"></svg-inline>
**/
export class SvgInline extends LitElement {
  @property() src = ''

  static styles: CSSResult = css`
    :host {
      display: inline-flex;
      vertical-align: text-bottom;
      --svg-color: #fff;
    }
    @media (prefers-color-scheme: light) {
      :host {
        --svg-color: #000;
      }
    }
    svg {
      fill: var(--svg-color);
      display: block;
    }
  `

  render(): TemplateResult {
    return html`${unsafeHTML(svg_map[this.src] ?? '')}`
  }
}

customElements.define('svg-inline', SvgInline)
