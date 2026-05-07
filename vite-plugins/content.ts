import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, resolve, basename, extname } from 'node:path'
import { Marked } from 'marked'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
const CONTENT_DIR = 'content'
const ICONS_DIR = `${CONTENT_DIR}/icons`

/**
  Load an SVG icon by name from content/icons/, injecting fill="currentColor".
  Returns null if the file is not found.
**/
function loadIcon(name: string): string | null {
  try {
    const svg = readFileSync(`${ICONS_DIR}/${name}.svg`, 'utf8').trim()
    return svg.replace(/^<svg /, '<svg fill="currentColor" ')
  } catch {
    return null
  }
}

/**
  Build a marked instance with a custom image renderer.
  Images whose href starts with "icon:" are replaced with an inline SVG span.
  Example markdown: ![facebook](icon:facebook-icon)
**/
function buildMarked(): Marked {
  const instance = new Marked()
  instance.use({
    renderer: {
      image({ href, text }: { href: string; text: string; title: string | null }): string | false {
        if (!href.startsWith('icon:')) return false
        const name = href.slice('icon:'.length)
        const svg = loadIcon(name)
        const aria = text ? ` aria-label="${text}"` : ' aria-hidden="true"'
        if (!svg) return `<span class="svg-inline"${aria}></span>`
        return `<span class="svg-inline"${aria}>${svg}</span>`
      },
    },
  })
  return instance
}

export interface PageEntry {
  /** Output path relative to dist root, e.g. "admin/help.html" */
  route: string
  /** Path to the .md file in /content without extension, e.g. "admin/help" */
  md: string
}

/**
  Injects markdown content from /content into HTML files.

  For index.html and other standalone pages, placeholders like %MESSAGE% are replaced
  with the parsed HTML of the corresponding .md file.

  For pages listed in the `pages` option, a single app.html template is used. Each page
  replaces %TITLE% (taken from the first # heading in the .md file) and %CONTENT%, and
  is emitted at its declared route during build. app.html itself is not emitted.
**/
export function content(options: { pages?: PageEntry[] } = {}): Plugin {
  const pages = options.pages ?? []
  let viteConfig: ResolvedConfig

  function mdFiles(): string[] {
    return readdirSync(CONTENT_DIR)
      .filter((f) => extname(f) === '.md')
      .map((f) => `${CONTENT_DIR}/${f}`)
  }

  function placeholder(filePath: string): string {
    return `%${basename(filePath, '.md').toUpperCase().replaceAll('-', '_')}%`
  }

  const md = buildMarked()

  function buildBlock(filePath: string): string {
    return (md.parse(readFileSync(filePath, 'utf8')) as string).trim()
  }

  function extractTitle(mdPath: string): string {
    const source = readFileSync(mdPath, 'utf8')
    const match = source.match(/^#\s+(.+)$/m)
    if (!match) return ''
    return match[1].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim()
  }

  function renderPage(page: PageEntry, appHtml: string): string {
    const mdPath = `${CONTENT_DIR}/${page.md}.md`
    return appHtml.replace('%TITLE%', extractTitle(mdPath)).replace('%CONTENT%', buildBlock(mdPath))
  }

  /** Derive the dev-server URL path from a route, e.g. "admin/help.html" → "/admin/help" */
  function routeToUrlPath(route: string): string {
    return '/' + route.replace(/(?:\/index)?\.html$/, '')
  }

  return {
    name: 'content',

    config() {
      if (pages.length === 0) return
      return {
        build: {
          rollupOptions: {
            input: { app: resolve('app.html') },
          },
        },
      }
    },

    configResolved(resolved: ResolvedConfig) {
      viteConfig = resolved
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html: string): string {
        for (const filePath of mdFiles()) {
          html = html.replace(placeholder(filePath), buildBlock(filePath))
        }
        return html
      },
    },

    closeBundle() {
      if (pages.length === 0 || viteConfig.command !== 'build') return

      const outDir = viteConfig.build.outDir
      const appHtmlPath = resolve(outDir, 'app.html')
      const appHtml = readFileSync(appHtmlPath, 'utf8')

      for (const page of pages) {
        const rendered = renderPage(page, appHtml)
        const outPath = resolve(outDir, page.route)
        mkdirSync(dirname(outPath), { recursive: true })
        writeFileSync(outPath, rendered)
      }

      unlinkSync(appHtmlPath)
    },

    configureServer(server: ViteDevServer) {
      const watchReload = (absPath: string) => {
        server.watcher.add(absPath)
        server.watcher.on('change', (file: string) => {
          if (file === absPath) server.ws.send({ type: 'full-reload' })
        })
      }

      for (const filePath of mdFiles()) watchReload(resolve(filePath))

      // Watch icon SVGs — they are inlined at build time so changes need a reload
      try {
        for (const f of readdirSync(ICONS_DIR).filter((f) => extname(f) === '.svg')) {
          watchReload(resolve(`${ICONS_DIR}/${f}`))
        }
      } catch { /* icons dir may not exist */ }

      if (pages.length === 0) return

      for (const page of pages) watchReload(resolve(`${CONTENT_DIR}/${page.md}.md`))

      // Serve app.html with injected content for each declared page route
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        const page = pages.find((p) => routeToUrlPath(p.route) === url)
        if (!page) return next()

        const appHtml = readFileSync(resolve('app.html'), 'utf8')
        const transformed = await server.transformIndexHtml(url, appHtml)
        const rendered = renderPage(page, transformed)
        res.setHeader('Content-Type', 'text/html')
        res.end(rendered)
      })
    },
  }
}
