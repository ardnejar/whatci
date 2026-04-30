import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { processDescription } from '../functions/lib/google-calendar.ts'

/**
  HTMLRewriter is a Cloudflare Workers global. This mock simulates its behaviour
  for the subset of features used by processDescription:
    - on('br', { element })       — emits a newline for each <br>
    - on('a[href]', { element })  — exposes href attribute via getAttribute
    - on('*', { text })           — emits all visible text content
  The mock strips tags with regex, which is acceptable in a test context.
**/
type ElementHandler = {
  element?: (el: { getAttribute(name: string): string | null }) => void
  text?: (chunk: { text: string }) => void
}

class HTMLRewriterMock {
  private _handlers: { selector: string; handler: ElementHandler }[] = []

  on(selector: string, handler: ElementHandler): this {
    this._handlers.push({ selector, handler })
    return this
  }

  transform(response: Response): { text(): Promise<string> } {
    const handlers = this._handlers
    return {
      async text() {
        const html = await response.text()

        for (const { selector, handler } of handlers) {
          if (selector === 'a[href]' && handler.element) {
            const href_re = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi
            let m: RegExpExecArray | null
            while ((m = href_re.exec(html)) !== null) {
              handler.element({ getAttribute: (name) => (name === 'href' ? m![1] : null) })
            }
          }
        }

        const plain = html
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .trim()

        for (const { selector, handler } of handlers) {
          if (selector === '*' && handler.text) handler.text({ text: plain })
        }

        return plain
      },
    }
  }
}

function stubFetch(...titles: string[]): void {
  const mocks = titles.map((title) =>
    Promise.resolve(
      new Response(`<html><head><title>${title}</title></head></html>`, {
        headers: { 'content-type': 'text/html' },
      }),
    ),
  )
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => mocks.shift() ?? Promise.resolve(new Response('', { status: 404 }))),
  )
}

beforeEach(() => {
  vi.stubGlobal('HTMLRewriter', HTMLRewriterMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('processDescription', () => {
  describe('plain text input (no HTML tags)', () => {
    it('bare URL → text is the URL, link has fetched page title', async () => {
      stubFetch('Spring Into Spring Jam 2026')
      const result = await processDescription('https://www.carmenserber.com/spring-into-spring-jam-2026/')
      expect(result.text).toBe('https://www.carmenserber.com/spring-into-spring-jam-2026/')
      expect(result.links).toEqual([
        { url: 'https://www.carmenserber.com/spring-into-spring-jam-2026/', title: 'Spring Into Spring Jam 2026' },
      ])
    })

    it('no URL → text returned, links is empty array', async () => {
      const result = await processDescription('Come join us for an open jam!')
      expect(result.text).toBe('Come join us for an open jam!')
      expect(result.links).toEqual([])
    })

    it('multiple URLs → all fetched as separate links', async () => {
      stubFetch('Site A', 'Site B')
      const result = await processDescription('Info: https://site-a.example.com and also https://site-b.example.com')
      expect(result.text).toBe('Info: https://site-a.example.com and also https://site-b.example.com')
      expect(result.links).toHaveLength(2)
      expect(result.links).toContainEqual({ url: 'https://site-a.example.com', title: 'Site A' })
      expect(result.links).toContainEqual({ url: 'https://site-b.example.com', title: 'Site B' })
    })

    it('duplicate URL → fetched once, appears once in links', async () => {
      stubFetch('My Page')
      const url = 'https://example.com/'
      const result = await processDescription(`${url} and again ${url}`)
      expect(result.links).toHaveLength(1)
      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    })

    it('trailing punctuation stripped from URL before fetching', async () => {
      stubFetch('My Page')
      const result = await processDescription('See https://example.com/page.')
      expect(result.links[0].url).toBe('https://example.com/page')
    })

    it('fetch failure → link uses fallback title "Website"', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
      const result = await processDescription('https://broken.example.com/')
      expect(result.links[0]).toEqual({ url: 'https://broken.example.com/', title: 'Website' })
    })
  })

  describe('HTML input', () => {
    it('href-only link → URL extracted from href, text is the link label', async () => {
      stubFetch('Deepening CI Series')
      const result = await processDescription(
        '<a href="https://example.com/deepening-ci">Deepening — CI series Details</a>',
      )
      expect(result.text).toBe('Deepening — CI series Details')
      expect(result.links).toEqual([{ url: 'https://example.com/deepening-ci', title: 'Deepening CI Series' }])
    })

    it('URL in both href and link text → deduplicated to one link', async () => {
      stubFetch('Some Page Title')
      const url = 'https://docs.example.com/doc123'
      const result = await processDescription(`Info: <a href="${url}">${url}</a>`)
      expect(result.links).toHaveLength(1)
      expect(result.links[0].url).toBe(url)
      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    })

    it('strips HTML tags, decodes entities, and joins <br> as newline', async () => {
      const result = await processDescription('<p>Hello &amp; welcome</p><br>Come join us')
      expect(result.text).toBe('Hello & welcome\nCome join us')
      expect(result.links).toEqual([])
    })
  })
})
