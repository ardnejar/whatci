import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, resolve, basename, extname } from 'node:path'
import { marked } from 'marked'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'

const CONTENT_DIR = 'content'

export interface PageEntry {
  /** Output path relative to dist root, e.g. "links.html" or "admin/help.html" */
  route: string
  /** Basename of the .md file in /content without extension, e.g. "links" or "admin-help" */
  md: string
  /** Value for the <title> element */
  title: string
}

/**
  Injects markdown content from /content into HTML files.

  For index.html and other standalone pages, placeholders like %MESSAGE% are replaced
  with the parsed HTML of the corresponding .md file.

  For pages listed in the `pages` option, a single app.html template is used. Each page
  replaces %TITLE% and %CONTENT% from its .md file, and is emitted
  at its declared route during build. app.html itself is not emitted.
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

  function buildBlock(filePath: string): string {
    const html = marked.parse(readFileSync(filePath, 'utf8')) as string
    const name = basename(filePath, '.md')
    return `<section class="${name}">${html.trim()}</section>`
  }

  function renderPage(page: PageEntry, appHtml: string): string {
    const mdPath = `${CONTENT_DIR}/${page.md}.md`
    const content = buildBlock(mdPath)
    return appHtml
      .replace('%TITLE%', page.title)
      .replace('%CONTENT%', content)
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
      handler(html: string, ctx): string {
        // For all HTML files, inject %NAME% placeholders from .md files
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
      // Watch all .md files used by standard pages
      for (const filePath of mdFiles()) {
        const absPath = resolve(filePath)
        server.watcher.add(absPath)
        server.watcher.on('change', (file: string) => {
          if (file === absPath) {
            server.ws.send({ type: 'full-reload' })
          }
        })
      }

      // Serve app.html with injected content for each declared page route
      if (pages.length === 0) return
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
