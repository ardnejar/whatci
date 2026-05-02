import { readFileSync, readdirSync } from 'node:fs'
import { resolve, basename, extname } from 'node:path'
import { marked } from 'marked'
import type { Plugin, ViteDevServer } from 'vite'

const CONTENT_DIR = 'content'

/**
  Scans the content/ folder for *.md files and injects each as HTML into index.html.
  The placeholder is derived from the filename: message.md → %VITE_MESSAGE%, admin-help.md → %VITE_ADMIN_HELP%
  Hyphens in filenames are normalized to underscores in the placeholder.
  The wrapper div uses the filename as its class: message.md → <div class="message">
**/
export function content(): Plugin {
  function mdFiles(): string[] {
    return readdirSync(CONTENT_DIR)
      .filter((f) => extname(f) === '.md')
      .map((f) => `${CONTENT_DIR}/${f}`)
  }

  function placeholder(filePath: string): string {
    return `%VITE_${basename(filePath, '.md').toUpperCase().replaceAll('-', '_')}%`
  }

  function buildBlock(filePath: string): string {
    const html = marked.parse(readFileSync(filePath, 'utf8')) as string
    const name = basename(filePath, '.md')
    return `<div class="${name}">${html.trim()}</div>`
  }

  return {
    name: 'content',

    transformIndexHtml: {
      order: 'pre',
      handler(html: string): string {
        for (const filePath of mdFiles()) {
          html = html.replace(placeholder(filePath), buildBlock(filePath))
        }
        return html
      },
    },

    configureServer(server: ViteDevServer) {
      for (const filePath of mdFiles()) {
        const absPath = resolve(filePath)
        server.watcher.add(absPath)
        server.watcher.on('change', (file: string) => {
          if (file === absPath) {
            server.ws.send({ type: 'full-reload' })
          }
        })
      }
    },
  }
}
